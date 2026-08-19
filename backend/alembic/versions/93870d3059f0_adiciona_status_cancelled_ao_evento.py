"""adiciona status cancelled ao evento

Revision ID: 93870d3059f0
Revises: bb0097f29284
Create Date: 2026-08-19 16:23:19.877294

"""
from alembic import op

# identificadores da revisão, usados pelo Alembic.
revision = '93870d3059f0'
down_revision = 'bb0097f29284'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE eventstatus ADD VALUE 'cancelled'")


def downgrade() -> None:
    # Postgres não tem DROP VALUE pra enum — reverter exigiria recriar o
    # tipo inteiro (e migrar quem já usa 'cancelled'). Não implementado de
    # propósito; se precisar reverter, é uma migration manual à parte.
    pass
