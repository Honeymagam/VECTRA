import hashlib, math
from abc import ABC, abstractmethod
class EmbeddingProvider(ABC):
 @abstractmethod
 def embed(self,text:str)->list[float]:...
class DeterministicEmbeddingProvider(EmbeddingProvider):
 def __init__(self, dimensions:int=64): self.dimensions=dimensions
 def embed(self,text):
  values=[0.0]*self.dimensions
  for token in text.lower().split():
   digest=hashlib.sha256(token.encode()).digest(); values[int.from_bytes(digest[:2],"big")%self.dimensions]+=1
  norm=math.sqrt(sum(x*x for x in values)) or 1; return [x/norm for x in values]
class LLMProvider(ABC):
 @abstractmethod
 def complete(self,system:str,user:str)->str:...
class DisabledLLM(LLMProvider):
 def complete(self,system,user): raise RuntimeError("No LLM configured. Set LLM_PROVIDER and credentials to enable generation.")
def cosine(a,b):
 return sum(x*y for x,y in zip(a,b))/((math.sqrt(sum(x*x for x in a))*math.sqrt(sum(y*y for y in b))) or 1)
