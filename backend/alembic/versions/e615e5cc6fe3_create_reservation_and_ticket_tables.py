"""cria tabelas de reserva e ingresso

Revision ID: e615e5cc6fe3
Revises: 42da7102200c
Create Date: 2026-08-17 13:13:25.397148

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


# identificadores da revisão, usados pelo Alembic.
revision = 'e615e5cc6fe3'
down_revision = '42da7102200c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### comandos gerados automaticamente pelo Alembic - ajuste se necessário! ###
    op.create_table('reservation',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('customer_id', sa.Integer(), nullable=False),
    sa.Column('event_id', sa.Integer(), nullable=False),
    sa.Column('status', sa.Enum('pending', 'paid', 'failed', 'cancelled', name='reservationstatus'), nullable=False),
    sa.Column('total', sa.Float(), nullable=False),
    sa.Column('expires_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['customer_id'], ['user.id'], ),
    sa.ForeignKeyConstraint(['event_id'], ['event.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('ticket',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('reservation_id', sa.Integer(), nullable=False),
    sa.Column('event_id', sa.Integer(), nullable=False),
    sa.Column('seat_id', sa.Integer(), nullable=False),
    sa.Column('qr_signature', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    sa.Column('share_token', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    sa.Column('status', sa.Enum('valid', 'used', 'cancelled', name='ticketstatus'), nullable=False),
    sa.Column('used_at', sa.DateTime(), nullable=True),
    sa.Column('validated_by', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['event_id'], ['event.id'], ),
    sa.ForeignKeyConstraint(['reservation_id'], ['reservation.id'], ),
    sa.ForeignKeyConstraint(['seat_id'], ['seat.id'], ),
    sa.ForeignKeyConstraint(['validated_by'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index('uq_ticket_event_seat_active', 'ticket', ['event_id', 'seat_id'], unique=True, postgresql_where=sa.text("status != 'cancelled'"))
    # ### fim dos comandos do Alembic ###


def downgrade() -> None:
    # ### comandos gerados automaticamente pelo Alembic - ajuste se necessário! ###
    op.drop_index('uq_ticket_event_seat_active', table_name='ticket', postgresql_where=sa.text("status != 'cancelled'"))
    op.drop_table('ticket')
    op.drop_table('reservation')
    # ### fim dos comandos do Alembic ###
