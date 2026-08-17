"""adiciona sinopse, gêneros e duração do filme ao evento

Revision ID: b4a2f89c47de
Revises: 4a99c0fbe4d7
Create Date: 2026-08-17 14:05:38.439300

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


# identificadores da revisão, usados pelo Alembic.
revision = 'b4a2f89c47de'
down_revision = '4a99c0fbe4d7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### comandos gerados automaticamente pelo Alembic - ajuste se necessário! ###
    op.add_column('event', sa.Column('overview', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('event', sa.Column('genres', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('event', sa.Column('runtime_minutes', sa.Integer(), nullable=True))
    # ### fim dos comandos do Alembic ###


def downgrade() -> None:
    # ### comandos gerados automaticamente pelo Alembic - ajuste se necessário! ###
    op.drop_column('event', 'runtime_minutes')
    op.drop_column('event', 'genres')
    op.drop_column('event', 'overview')
    # ### fim dos comandos do Alembic ###
