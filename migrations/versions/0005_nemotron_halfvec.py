"""Store Nemotron 3.5 embeddings in indexable halfvec columns.

Revision ID: 0005_nemotron_halfvec
Revises: 0004_educator_role
"""
from alembic import op


revision = "0005_nemotron_halfvec"
down_revision = "0004_educator_role"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return

    op.execute("DROP INDEX IF EXISTS ix_document_chunks_embedding_hnsw")
    op.execute("DROP INDEX IF EXISTS ix_concepts_embedding_hnsw")
    for table in ("document_chunks", "concepts"):
        op.execute(f"""
        DO $$
        DECLARE current_type text;
        BEGIN
            SELECT format_type(a.atttypid, a.atttypmod) INTO current_type
            FROM pg_attribute a
            WHERE a.attrelid = '{table}'::regclass AND a.attname = 'embedding';

            IF current_type LIKE 'vector%' THEN
                EXECUTE 'ALTER TABLE {table} ALTER COLUMN embedding TYPE halfvec(2048) USING '
                    || 'CASE WHEN vector_dims(embedding) = 2048 '
                    || 'THEN embedding::halfvec(2048) '
                    || 'ELSE array_fill(0::real, ARRAY[2048])::vector(2048)::halfvec(2048) END';
            ELSIF current_type <> 'halfvec(2048)' THEN
                RAISE EXCEPTION 'Unexpected {table}.embedding type: %', current_type;
            END IF;
        END $$;
        """)

    op.execute("CREATE INDEX ix_document_chunks_embedding_hnsw ON document_chunks USING hnsw (embedding halfvec_cosine_ops)")
    op.execute("CREATE INDEX ix_concepts_embedding_hnsw ON concepts USING hnsw (embedding halfvec_cosine_ops)")


def downgrade():
    # Embedding vectors cannot be losslessly reduced to the previous dimension.
    pass
