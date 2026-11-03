"""durable uploads and adaptive practice sessions"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision='0002_documents_and_practice_sessions'
down_revision='0001_initial_schema'
branch_labels=None
depends_on=None

def upgrade():
    op.add_column('documents',sa.Column('storage_path',sa.String(length=512),nullable=True))
    op.create_table('practice_sessions',
        sa.Column('id',sa.String(length=64),primary_key=True),
        sa.Column('user_id',sa.Integer(),sa.ForeignKey('users.id'),nullable=False,index=True),
        sa.Column('topic',sa.String(length=120),nullable=True),
        sa.Column('current_difficulty',postgresql.ENUM('EASY','MEDIUM','HARD',name='difficulty',create_type=False).with_variant(sa.String(length=10),'sqlite'),nullable=False),
        sa.Column('question_ids',sa.JSON(),nullable=False),
        sa.Column('answered_question_ids',sa.JSON(),nullable=False),
        sa.Column('created_at',sa.DateTime(timezone=True),nullable=False),
        sa.Column('completed_at',sa.DateTime(timezone=True),nullable=True),
    )
def downgrade():
    op.drop_table('practice_sessions')
    op.drop_column('documents','storage_path')
