"""Add the educator account role."""
from alembic import op

revision = "0004_educator_role"
down_revision = "0003_student_profile_goal"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("""
        DO $$
        DECLARE enum_type text;
        BEGIN
            SELECT t.typname INTO enum_type
            FROM pg_type t
            JOIN pg_namespace n ON n.oid = t.typnamespace
            WHERE n.nspname = current_schema()
              AND t.typname IN ('role', 'Role')
            LIMIT 1;
            IF enum_type IS NOT NULL THEN
                EXECUTE format('ALTER TYPE %I ADD VALUE IF NOT EXISTS %L', enum_type, 'EDUCATOR');
            END IF;
        END $$;
        """)


def downgrade():
    # PostgreSQL enum values cannot be removed safely in place.
    pass
