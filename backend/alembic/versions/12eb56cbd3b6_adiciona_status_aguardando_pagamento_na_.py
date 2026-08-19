"""adiciona status aguardando pagamento na portaria

Revision ID: 12eb56cbd3b6
Revises: 93870d3059f0
Create Date: 2026-08-19 20:31:24.241274

"""
from alembic import op

# identificadores da revisão, usados pelo Alembic.
revision = '12eb56cbd3b6'
down_revision = '93870d3059f0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE reservationstatus ADD VALUE 'awaiting_door_payment'")


def downgrade() -> None:
    # Postgres não tem DROP VALUE pra enum — reverter exigiria recriar o
    # tipo inteiro. Não implementado de propósito.
    pass
