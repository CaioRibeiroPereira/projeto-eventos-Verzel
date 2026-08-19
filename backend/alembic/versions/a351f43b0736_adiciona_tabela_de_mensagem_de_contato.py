"""adiciona tabela de mensagem de contato

Revision ID: a351f43b0736
Revises: 5c79ee73c4b8
Create Date: 2026-08-18 21:38:40.658923

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel

# identificadores da revisão, usados pelo Alembic.
revision = 'a351f43b0736'
down_revision = '5c79ee73c4b8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### comandos gerados automaticamente pelo Alembic - ajuste se necessário! ###
    op.create_table('contactmessage',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('email', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('company', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    sa.Column('message', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('origin', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    # ### fim dos comandos do Alembic ###
    # (as duas colunas event.format/event.language já são NOT NULL desde a
    # migration anterior — o autogenerate comparou errado e ia relaxar essa
    # restrição à toa, então essas duas alter_column foram removidas daqui)


def downgrade() -> None:
    # ### comandos gerados automaticamente pelo Alembic - ajuste se necessário! ###
    op.drop_table('contactmessage')
    # ### fim dos comandos do Alembic ###
