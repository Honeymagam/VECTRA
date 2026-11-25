"""Persist tutor conversations and message history."""
from alembic import op
import sqlalchemy as sa


revision = "0006_tutor_conversations"
down_revision = "0005_nemotron_halfvec"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("tutor_conversations"):
        op.create_table(
            "tutor_conversations",
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("title", sa.String(length=200), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
    inspector = sa.inspect(bind)
    indexes = {index["name"] for index in inspector.get_indexes("tutor_conversations")}
    if "ix_tutor_conversations_user_id" not in indexes:
        op.create_index("ix_tutor_conversations_user_id", "tutor_conversations", ["user_id"])

    if not inspector.has_table("tutor_messages"):
        op.create_table(
            "tutor_messages",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("conversation_id", sa.String(length=36), sa.ForeignKey("tutor_conversations.id", ondelete="CASCADE"), nullable=False),
            sa.Column("role", sa.String(length=20), nullable=False),
            sa.Column("content", sa.Text(), nullable=False),
            sa.Column("sources", sa.JSON(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
    inspector = sa.inspect(bind)
    indexes = {index["name"] for index in inspector.get_indexes("tutor_messages")}
    if "ix_tutor_messages_conversation_id" not in indexes:
        op.create_index("ix_tutor_messages_conversation_id", "tutor_messages", ["conversation_id"])


def downgrade():
    op.drop_table("tutor_messages")
    op.drop_table("tutor_conversations")
