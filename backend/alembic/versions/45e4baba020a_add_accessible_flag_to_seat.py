"""adiciona indicador de acessibilidade ao assento

Revision ID: 45e4baba020a
Revises: c04d82917920
Create Date: 2026-08-17 16:13:31.025744

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


# identificadores da revisão, usados pelo Alembic.
revision = '45e4baba020a'
down_revision = 'c04d82917920'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### comandos gerados automaticamente pelo Alembic - ajuste se necessário! ###
    op.add_column('seat', sa.Column('accessible', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    # ### fim dos comandos do Alembic ###


def downgrade() -> None:
    # ### comandos gerados automaticamente pelo Alembic - ajuste se necessário! ###
    op.drop_column('seat', 'accessible')
    # ### fim dos comandos do Alembic ###
