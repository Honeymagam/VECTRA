"""initial VECTRA schema

Revision ID: 0001_initial_schema
"""
from alembic import op
from app.database import Base
from app.models import core
revision='0001_initial_schema'
down_revision=None
branch_labels=None
depends_on=None
def upgrade():
    bind=op.get_bind()
    if bind.dialect.name=='postgresql':
        op.execute('CREATE EXTENSION IF NOT EXISTS vector')
    Base.metadata.create_all(bind=bind)
    if bind.dialect.name=='postgresql':
        op.execute('CREATE INDEX IF NOT EXISTS ix_document_chunks_embedding_hnsw ON document_chunks USING hnsw (embedding vector_cosine_ops)')
        op.execute('CREATE INDEX IF NOT EXISTS ix_concepts_embedding_hnsw ON concepts USING hnsw (embedding vector_cosine_ops)')
def downgrade():
    Base.metadata.drop_all(bind=op.get_bind())
