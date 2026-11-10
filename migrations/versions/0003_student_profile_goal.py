"""persist student profile goals"""
from alembic import op
import sqlalchemy as sa

revision = "0003_student_profile_goal"
down_revision = "0002_practice_sessions"
branch_labels = None
depends_on = None


def upgrade():
    columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("student_profiles")}
    if "goal" not in columns:
        op.add_column(
            "student_profiles",
            sa.Column("goal", sa.String(length=120), nullable=False, server_default="Get placed in a top company"),
        )


def downgrade():
    columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("student_profiles")}
    if "goal" in columns:
        op.drop_column("student_profiles", "goal")
