"""adiciona trailer do youtube ao evento

Revision ID: e8da854348cb
Revises: f4bd1d482807
Create Date: 2026-08-18 14:29:51.593696

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


# identificadores da revisão, usados pelo Alembic.
revision = 'e8da854348cb'
down_revision = 'f4bd1d482807'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### comandos gerados automaticamente pelo Alembic - ajuste se necessário! ###
    op.add_column('event', sa.Column('youtube_key', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    # ### fim dos comandos do Alembic ###


def downgrade() -> None:
    # ### comandos gerados automaticamente pelo Alembic - ajuste se necessário! ###
    op.drop_column('event', 'youtube_key')
    # ### fim dos comandos do Alembic ###
