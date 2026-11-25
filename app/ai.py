import hashlib, math, json, logging
from abc import ABC, abstractmethod
import httpx
from .config import get_settings
log=logging.getLogger(__name__)
class EmbeddingProvider(ABC):
 @abstractmethod
 def embed(self,text:str,input_type:str="passage",truncate:str="END")->list[float]:...
 def embed_many(self,texts:list[str],input_type:str="passage",truncate:str="END")->list[list[float]]:
  return [self.embed(text,input_type=input_type,truncate=truncate) for text in texts]
class EmbeddingContentRejected(RuntimeError):
 """An upstream content filter rejected embedding input."""
class DeterministicEmbeddingProvider(EmbeddingProvider):
 def __init__(self, dimensions:int=64): self.dimensions=dimensions
 def embed(self,text,input_type="passage",truncate="END"):
  values=[0.0]*self.dimensions
  for token in text.lower().split():
   digest=hashlib.sha256(token.encode()).digest(); values[int.from_bytes(digest[:2],"big")%self.dimensions]+=1
  norm=math.sqrt(sum(x*x for x in values)) or 1; return [x/norm for x in values]
class OpenAICompatibleEmbeddingProvider(EmbeddingProvider):
 def __init__(self,api_key:str,base_url:str,model:str,dimensions:int): self.api_key,self.base_url,self.model,self.dimensions=api_key,base_url.rstrip('/'),model,dimensions
 def embed(self,text,input_type="passage",truncate="END"):
  return self.embed_many([text],input_type=input_type,truncate=truncate)[0]
 def embed_many(self,texts,input_type="passage",truncate="END"):
  if not self.api_key: raise RuntimeError('EMBEDDING_API_KEY is not configured')
  if not texts: return []
  payload={'model':self.model,'input':texts,'input_type':input_type,'encoding_format':'float','truncate':truncate}
  # Nemotron 3.5 returns its native 2048 dimensions when this field is omitted.
  if self.dimensions != 2048: payload['dimensions']=self.dimensions
  response=httpx.post(f'{self.base_url}/embeddings',headers={'Authorization':f'Bearer {self.api_key}'},json=payload,timeout=45)
  if response.status_code==422 and 'content safety screening' in response.text.lower():
   raise EmbeddingContentRejected('The provider content safety filter rejected this passage.')
  if response.status_code==422 and len(texts)>1:
   midpoint=len(texts)//2
   return self.embed_many(texts[:midpoint],input_type=input_type,truncate=truncate)+self.embed_many(texts[midpoint:],input_type=input_type,truncate=truncate)
  if response.status_code==422: raise RuntimeError(f'Embedding provider rejected an input (HTTP 422): {response.text[:300]}')
  response.raise_for_status()
  try:
   results=response.json()['data']
   if len(results)!=len(texts): raise ValueError('Wrong number of embeddings')
   if results and 'index' in results[0]: results=sorted(results,key=lambda item:item['index'])
   embeddings=[[float(value) for value in item['embedding']] for item in results]
  except (KeyError,IndexError,TypeError,ValueError) as exc: raise RuntimeError('Embedding provider returned an invalid embedding response') from exc
  for embedding in embeddings:
   if len(embedding)!=self.dimensions: raise RuntimeError(f'Embedding provider returned {len(embedding)} dimensions; expected {self.dimensions}')
  return embeddings
def get_embedding_provider()->EmbeddingProvider:
 settings=get_settings()
 if settings.embedding_provider.lower() in {'openai','openai_compatible'}:
  return OpenAICompatibleEmbeddingProvider(settings.embedding_api_key,settings.embedding_base_url,settings.embedding_model,settings.embedding_dimensions)
 return DeterministicEmbeddingProvider(settings.embedding_dimensions)
class LLMProvider(ABC):
 @abstractmethod
 def complete(self,system:str,user:str)->str:...
class DisabledLLM(LLMProvider):
 def complete(self,system,user): raise RuntimeError("No LLM configured. Set LLM_PROVIDER and credentials to enable generation.")
class OpenAICompatibleLLM(LLMProvider):
 """Minimal OpenAI-compatible chat adapter. Providers are selected by config, never hard-coded in routes."""
 def __init__(self, api_key:str, base_url:str, model:str, fallback_model:str=""): self.api_key,self.base_url,self.model,self.fallback_model=api_key,base_url.rstrip('/'),model,fallback_model
 def complete(self,system,user):
  if not self.api_key: raise RuntimeError("LLM_API_KEY is not configured")
  payload={"model":self.model,"temperature":0.2,"messages":[{"role":"system","content":system},{"role":"user","content":user}]}
  url=f"{self.base_url}/chat/completions"; headers={"Authorization":f"Bearer {self.api_key}"}
  fallback=self.fallback_model and self.fallback_model!=self.model
  try:
   response=httpx.post(url,headers=headers,json=payload,timeout=15)
  except httpx.TimeoutException:
   if not fallback: raise
   log.warning("Primary LLM model %s timed out; switching to fallback model %s",self.model,self.fallback_model)
   payload["model"]=self.fallback_model
   response=httpx.post(url,headers=headers,json=payload,timeout=30)
  if response.status_code==503 and fallback:
   log.warning("Primary LLM model %s is unavailable; retrying with fallback model %s",self.model,self.fallback_model)
   payload["model"]=self.fallback_model
   response=httpx.post(url,headers=headers,json=payload,timeout=30)
  response.raise_for_status(); return response.json()["choices"][0]["message"]["content"]
def get_llm()->LLMProvider:
 settings=get_settings()
 if settings.llm_provider.lower() in {"openai", "openai_compatible"}: return OpenAICompatibleLLM(settings.llm_api_key,settings.llm_base_url,settings.llm_model,settings.llm_fallback_model)
 return DisabledLLM()
def parse_json_object(value:str)->dict:
 """Accept a JSON object only; strips Markdown fences without attempting to repair model output."""
 clean=value.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
 result=json.loads(clean)
 if not isinstance(result,dict): raise ValueError("LLM output must be a JSON object")
 return result
def cosine(a,b):
 return sum(x*y for x,y in zip(a,b))/((math.sqrt(sum(x*x for x in a))*math.sqrt(sum(y*y for y in b))) or 1)
