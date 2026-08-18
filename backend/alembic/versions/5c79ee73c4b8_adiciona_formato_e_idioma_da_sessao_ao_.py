"""adiciona formato e idioma da sessao ao evento

Revision ID: 5c79ee73c4b8
Revises: e8da854348cb
Create Date: 2026-08-18 15:03:42.547371

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import sqlmodel


# identificadores da revisão, usados pelo Alembic.
revision = '5c79ee73c4b8'
down_revision = 'e8da854348cb'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### comandos gerados automaticamente pelo Alembic - ajuste se necessário! ###
    bind = op.get_bind()
    eventformat = postgresql.ENUM('2D', '3D', name='eventformat')
    eventformat.create(bind, checkfirst=True)
    eventlanguage = postgresql.ENUM('Dublado', 'Legendado', name='eventlanguage')
    eventlanguage.create(bind, checkfirst=True)

    op.add_column(
        'event',
        sa.Column('format', eventformat, nullable=False, server_default='2D'),
    )
    op.add_column(
        'event',
        sa.Column('language', eventlanguage, nullable=False, server_default='Dublado'),
    )
    # ### fim dos comandos do Alembic ###


def downgrade() -> None:
    # ### comandos gerados automaticamente pelo Alembic - ajuste se necessário! ###
    op.drop_column('event', 'language')
    op.drop_column('event', 'format')
    postgresql.ENUM(name='eventlanguage').drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name='eventformat').drop(op.get_bind(), checkfirst=True)
    # ### fim dos comandos do Alembic ###
