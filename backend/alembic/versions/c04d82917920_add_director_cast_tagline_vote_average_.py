"""adiciona direção, elenco, tagline e nota ao evento

Revision ID: c04d82917920
Revises: b4a2f89c47de
Create Date: 2026-08-17 15:33:31.021788

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


# identificadores da revisão, usados pelo Alembic.
revision = 'c04d82917920'
down_revision = 'b4a2f89c47de'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### comandos gerados automaticamente pelo Alembic - ajuste se necessário! ###
    op.add_column('event', sa.Column('director', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('event', sa.Column('cast', sa.JSON(), nullable=True))
    op.add_column('event', sa.Column('tagline', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('event', sa.Column('vote_average', sa.Float(), nullable=True))
    # ### fim dos comandos do Alembic ###


def downgrade() -> None:
    # ### comandos gerados automaticamente pelo Alembic - ajuste se necessário! ###
    op.drop_column('event', 'vote_average')
    op.drop_column('event', 'tagline')
    op.drop_column('event', 'cast')
    op.drop_column('event', 'director')
    # ### fim dos comandos do Alembic ###
