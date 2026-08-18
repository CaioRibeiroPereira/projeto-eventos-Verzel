"""adiciona tabela de credencial de crachá para organizador e portaria

Revision ID: f4bd1d482807
Revises: 87b348724904
Create Date: 2026-08-18 12:34:14.264770

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import sqlmodel

userrole_enum = postgresql.ENUM(
    "organizer", "customer", "gate", name="userrole", create_type=False
)


# identificadores da revisão, usados pelo Alembic.
revision = 'f4bd1d482807'
down_revision = '87b348724904'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### comandos gerados automaticamente pelo Alembic - ajuste se necessário! ###
    op.create_table('staffcredential',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('code', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('role', userrole_enum, nullable=False),
    sa.Column('holder_name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('used_by_user_id', sa.Integer(), nullable=True),
    sa.Column('used_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['used_by_user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_staffcredential_code'), 'staffcredential', ['code'], unique=True)
    # ### fim dos comandos do Alembic ###


def downgrade() -> None:
    # ### comandos gerados automaticamente pelo Alembic - ajuste se necessário! ###
    op.drop_index(op.f('ix_staffcredential_code'), table_name='staffcredential')
    op.drop_table('staffcredential')
    # ### fim dos comandos do Alembic ###
