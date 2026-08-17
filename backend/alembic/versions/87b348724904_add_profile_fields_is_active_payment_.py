"""adiciona campos de perfil: is_active, tabela de cartão salvo

Revision ID: 87b348724904
Revises: 45e4baba020a
Create Date: 2026-08-17 17:28:05.858323

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


# identificadores da revisão, usados pelo Alembic.
revision = '87b348724904'
down_revision = '45e4baba020a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### comandos gerados automaticamente pelo Alembic - ajuste se necessário! ###
    op.create_table('paymentcard',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('brand', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('last4', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('holder_name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('expiry', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.add_column('user', sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')))
    # ### fim dos comandos do Alembic ###


def downgrade() -> None:
    # ### comandos gerados automaticamente pelo Alembic - ajuste se necessário! ###
    op.drop_column('user', 'is_active')
    op.drop_table('paymentcard')
    # ### fim dos comandos do Alembic ###
