"""cria tabelas de evento e assento

Revision ID: 42da7102200c
Revises: cfc9734cb0a3
Create Date: 2026-08-15 20:48:39.872102

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


# identificadores da revisão, usados pelo Alembic.
revision = '42da7102200c'
down_revision = 'cfc9734cb0a3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### comandos gerados automaticamente pelo Alembic - ajuste se necessário! ###
    op.create_table('event',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('organizer_id', sa.Integer(), nullable=False),
    sa.Column('tmdb_movie_id', sa.Integer(), nullable=False),
    sa.Column('title', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('poster_path', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    sa.Column('local', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('starts_at', sa.DateTime(), nullable=False),
    sa.Column('price', sa.Float(), nullable=False),
    sa.Column('status', sa.Enum('draft', 'published', name='eventstatus'), nullable=False),
    sa.ForeignKeyConstraint(['organizer_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('seat',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('event_id', sa.Integer(), nullable=False),
    sa.Column('label', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('row_label', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
    sa.Column('col', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['event_id'], ['event.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('event_id', 'label')
    )
    # ### fim dos comandos do Alembic ###


def downgrade() -> None:
    # ### comandos gerados automaticamente pelo Alembic - ajuste se necessário! ###
    op.drop_table('seat')
    op.drop_table('event')
    # ### fim dos comandos do Alembic ###
