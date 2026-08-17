"""adiciona backdrop_path ao evento

Revision ID: 4a99c0fbe4d7
Revises: e615e5cc6fe3
Create Date: 2026-08-17 13:48:05.899467

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


# identificadores da revisão, usados pelo Alembic.
revision = '4a99c0fbe4d7'
down_revision = 'e615e5cc6fe3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### comandos gerados automaticamente pelo Alembic - ajuste se necessário! ###
    op.add_column('event', sa.Column('backdrop_path', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    # ### fim dos comandos do Alembic ###


def downgrade() -> None:
    # ### comandos gerados automaticamente pelo Alembic - ajuste se necessário! ###
    op.drop_column('event', 'backdrop_path')
    # ### fim dos comandos do Alembic ###
