import random
from datetime import datetime, timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from accounts.models import User, Customer
from banking.models import Branch, Account, Transaction, Beneficiary, AuditLog
from loans.models import Loan, LoanPayment

class Command(BaseCommand):
    help = 'Seeds database with realistic data: 1 Admin, 10 Customers, 15 Accounts, 100+ Transactions, 5 Loans'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Starting database seeding...")

        # Clear existing data safely
        LoanPayment.objects.all().delete()
        Loan.objects.all().delete()
        Beneficiary.objects.all().delete()
        Transaction.objects.all().delete()
        Account.objects.all().delete()
        Customer.objects.all().delete()
        Branch.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        AuditLog.objects.all().delete()

        # 1. Create Admin
        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@aetheriareserve.in',
                'first_name': 'System',
                'last_name': 'Administrator',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin_user.set_password('Admin@123')
        admin_user.save()
        self.stdout.write(self.style.SUCCESS("Created Admin: admin / Admin@123"))

        # 2. Create Branches
        branches_data = [
            {'name': 'Nariman Point Flagship', 'ifsc_code': 'APEX0001001', 'city': 'Mumbai'},
            {'name': 'Connaught Place Central', 'ifsc_code': 'APEX0002002', 'city': 'New Delhi'},
            {'name': 'Indiranagar Tech Park', 'ifsc_code': 'APEX0003003', 'city': 'Bengaluru'},
            {'name': 'HITEC City Cyber Hub', 'ifsc_code': 'APEX0004004', 'city': 'Hyderabad'},
        ]
        branches = []
        for b_data in branches_data:
            branch = Branch.objects.create(**b_data)
            branches.append(branch)

        # 3. Create 10 Customers
        customers_info = [
            ('customer1', 'Aarav Sharma', 'aarav.sharma@example.in', '1992-05-14', '+91 98201 12345', 'Flat 402, Sea Green Apts, Worli', 'Mumbai', 'verified'),
            ('customer2', 'Priya Patel', 'priya.patel@example.in', '1995-11-20', '+91 98791 23456', '12 Heritage Enclave, Satellite', 'Ahmedabad', 'verified'),
            ('customer3', 'Rohan Iyer', 'rohan.iyer@example.in', '1988-03-08', '+91 97402 34567', '45 Palm Grove, Indiranagar', 'Bengaluru', 'verified'),
            ('customer4', 'Ananya Nair', 'ananya.nair@example.in', '1996-08-15', '+91 98460 45678', 'Plot 88, Marine Drive', 'Kochi', 'verified'),
            ('customer5', 'Vikram Singh', 'vikram.singh@example.in', '1985-01-25', '+91 98110 56789', 'B-14 Hauz Khas Enclave', 'New Delhi', 'verified'),
            ('customer6', 'Neha Gupta', 'neha.gupta@example.in', '1998-07-30', '+91 99220 67890', '702 Sky High, Baner', 'Pune', 'verified'),
            ('customer7', 'Kabir Mukherjee', 'kabir.m@example.in', '1990-12-12', '+91 98300 78901', '14 Ballygunge Circular Rd', 'Kolkata', 'verified'),
            ('customer8', 'Sneha Reddy', 'sneha.reddy@example.in', '1994-04-05', '+91 98490 89012', 'Villa 23, Jubilee Hills', 'Hyderabad', 'verified'),
            ('customer9', 'Aditya Verma', 'aditya.v@example.in', '1997-09-18', '+91 98880 90123', 'Sector 8-C, Madhya Marg', 'Chandigarh', 'pending'),
            ('customer10', 'Meera Joshi', 'meera.joshi@example.in', '1993-02-28', '+91 94140 01234', '56 Malviya Nagar', 'Jaipur', 'verified'),
        ]

        created_customers = []
        for username, full_name, email, dob, phone, address, city, kyc in customers_info:
            user = User.objects.create_user(
                username=username,
                email=email,
                password='Customer@123',
                first_name=full_name.split()[0],
                last_name=' '.join(full_name.split()[1:]),
                role='customer'
            )
            cust = Customer.objects.create(
                user=user,
                full_name=full_name,
                dob=dob,
                phone=phone,
                address=address,
                city=city,
                kyc_status=kyc
            )
            created_customers.append(cust)

        self.stdout.write(self.style.SUCCESS(f"Created {len(created_customers)} customers (passwords: Customer@123)"))

        # 4. Create 15 Accounts
        # customer1 gets 2 accounts (1 savings, 1 current)
        # customer2 gets 2 accounts
        # customer3 gets 2 accounts
        # customer4 gets 2 accounts
        # customer5 gets 2 accounts
        # customer6 to customer10 get 1 account each = total 15
        accounts = []
        acc_configs = [
            (created_customers[0], branches[0], 'savings', Decimal('125400.50'), '501002345671'),
            (created_customers[0], branches[0], 'current', Decimal('450000.00'), '501002345672'),
            (created_customers[1], branches[0], 'savings', Decimal('84500.00'), '502003456781'),
            (created_customers[1], branches[0], 'current', Decimal('210000.75'), '502003456782'),
            (created_customers[2], branches[2], 'savings', Decimal('342000.00'), '503004567891'),
            (created_customers[2], branches[2], 'current', Decimal('75000.00'), '503004567892'),
            (created_customers[3], branches[2], 'savings', Decimal('92300.25'), '504005678901'),
            (created_customers[3], branches[2], 'current', Decimal('180000.00'), '504005678902'),
            (created_customers[4], branches[1], 'savings', Decimal('560000.00'), '505006789011'),
            (created_customers[4], branches[1], 'current', Decimal('115000.00'), '505006789012'),
            (created_customers[5], branches[0], 'savings', Decimal('67000.50'), '506007890121'),
            (created_customers[6], branches[1], 'savings', Decimal('145000.00'), '507008901231'),
            (created_customers[7], branches[3], 'savings', Decimal('289000.00'), '508009012341'),
            (created_customers[8], branches[1], 'savings', Decimal('42000.00'), '509000123451'),
            (created_customers[9], branches[1], 'savings', Decimal('118500.00'), '510001234561'),
        ]

        for cust, branch, a_type, bal, acc_no in acc_configs:
            acc = Account.objects.create(
                account_number=acc_no,
                customer=cust,
                branch=branch,
                type=a_type,
                balance=bal,
                status='active',
                opened_at=timezone.now() - timedelta(days=random.randint(60, 365))
            )
            accounts.append(acc)

        self.stdout.write(self.style.SUCCESS(f"Created {len(accounts)} accounts"))

        # 5. Create Beneficiaries
        # Aarav has Priya, Rohan and Sneha as beneficiaries
        Beneficiary.objects.create(customer=created_customers[0], beneficiary_account=accounts[2], nickname='Priya Savings')
        Beneficiary.objects.create(customer=created_customers[0], beneficiary_account=accounts[4], nickname='Rohan Tech')
        Beneficiary.objects.create(customer=created_customers[0], beneficiary_account=accounts[12], nickname='Sneha Hyderabad')
        # Priya has Aarav
        Beneficiary.objects.create(customer=created_customers[1], beneficiary_account=accounts[0], nickname='Aarav Mumbai')
        # Rohan has Ananya
        Beneficiary.objects.create(customer=created_customers[2], beneficiary_account=accounts[6], nickname='Ananya Kochi')

        # 6. Generate 120+ Transactions across the last 60 days
        now = timezone.now()
        txn_count = 0

        # Initial deposit transactions for all accounts
        for acc in accounts:
            ref = f"INIT{acc.account_number[-6:]}"
            Transaction.objects.create(
                account=acc,
                type='deposit',
                amount=acc.balance,
                balance_after=acc.balance,
                reference_no=ref,
                description='Initial Account Opening Deposit',
                created_at=acc.opened_at
            )
            txn_count += 1

        # Generate realistic historical transactions
        descriptions = {
            'deposit': ['Salary Credit from Employer', 'Consulting Fee Received', 'Cash Deposit at CDM Branch', 'Dividend Payout Received', 'Tax Refund Credited'],
            'withdraw': ['ATM Cash Withdrawal', 'POS Debit Card Swipe at Mall', 'Online Purchase - Electronics', 'Supermarket Grocery Billing', 'Utility Bills Payment'],
            'transfer': ['Rent Payment for Month', 'Medical Reimbursement', 'Tuition & Books Fee', 'Emergency Funds Transfer', 'Freelance Project Advance']
        }

        # Create random realistic deposits and withdrawals
        for i in range(70):
            acc = random.choice(accounts)
            days_ago = random.randint(1, 55)
            txn_time = now - timedelta(days=days_ago, hours=random.randint(1, 23), minutes=random.randint(1, 59))
            t_type = random.choice(['deposit', 'withdraw'])
            amt = Decimal(str(random.randint(5, 50) * 100)) # 500 to 5000

            if t_type == 'withdraw' and (acc.balance - amt) < acc.min_balance:
                t_type = 'deposit'

            if t_type == 'deposit':
                acc.balance += amt
                desc = random.choice(descriptions['deposit'])
            else:
                acc.balance -= amt
                desc = random.choice(descriptions['withdraw'])

            acc.save(update_fields=['balance'])
            ref_no = f"TXN{txn_time.strftime('%y%m%d')}{random.randint(100000, 999999)}"

            Transaction.objects.create(
                account=acc,
                type=t_type,
                amount=amt,
                balance_after=acc.balance,
                reference_no=ref_no,
                description=desc,
                created_at=txn_time
            )
            txn_count += 1

        # Create 25 Atomic Transfer Pairs (50 transactions)
        for i in range(25):
            sender = random.choice(accounts)
            receiver = random.choice([a for a in accounts if a.id != sender.id])
            days_ago = random.randint(1, 45)
            txn_time = now - timedelta(days=days_ago, hours=random.randint(1, 23), minutes=random.randint(1, 59))
            amt = Decimal(str(random.randint(10, 80) * 100)) # 1000 to 8000

            if (sender.balance - amt) >= sender.min_balance:
                sender.balance -= amt
                receiver.balance += amt
                sender.save(update_fields=['balance'])
                receiver.save(update_fields=['balance'])

                prefix = f"TRF{txn_time.strftime('%m%d%H%M')}{random.randint(100, 999)}"
                desc = random.choice(descriptions['transfer'])

                # Sender row (transfer_out)
                Transaction.objects.create(
                    account=sender,
                    type='transfer_out',
                    amount=amt,
                    balance_after=sender.balance,
                    reference_no=f"{prefix}D",
                    description=f"{desc} to A/C {receiver.account_number}",
                    related_account=receiver,
                    created_at=txn_time
                )
                # Receiver row (transfer_in)
                Transaction.objects.create(
                    account=receiver,
                    type='transfer_in',
                    amount=amt,
                    balance_after=receiver.balance,
                    reference_no=f"{prefix}C",
                    description=f"{desc} from A/C {sender.account_number}",
                    related_account=sender,
                    created_at=txn_time
                )
                txn_count += 2

        self.stdout.write(self.style.SUCCESS(f"Generated {txn_count} total transactions"))

        # 7. Create 5 Loans
        loans_data = [
            # Aarav Sharma - Home Loan (Active)
            {
                'customer': created_customers[0],
                'account': accounts[0],
                'loan_type': 'home',
                'principal': Decimal('2500000.00'),
                'interest_rate': Decimal('8.50'),
                'tenure_months': 120,
                'status': 'active',
                'approved_by': admin_user,
                'approved_at': now - timedelta(days=90),
                'applied_at': now - timedelta(days=95),
            },
            # Priya Patel - Education Loan (Active)
            {
                'customer': created_customers[1],
                'account': accounts[2],
                'loan_type': 'education',
                'principal': Decimal('800000.00'),
                'interest_rate': Decimal('9.25'),
                'tenure_months': 48,
                'status': 'active',
                'approved_by': admin_user,
                'approved_at': now - timedelta(days=60),
                'applied_at': now - timedelta(days=65),
            },
            # Rohan Iyer - Vehicle Loan (Pending)
            {
                'customer': created_customers[2],
                'account': accounts[4],
                'loan_type': 'vehicle',
                'principal': Decimal('650000.00'),
                'interest_rate': Decimal('9.75'),
                'tenure_months': 60,
                'status': 'pending',
                'approved_by': None,
                'approved_at': None,
                'applied_at': now - timedelta(days=3),
            },
            # Vikram Singh - Personal Loan (Pending)
            {
                'customer': created_customers[4],
                'account': accounts[8],
                'loan_type': 'personal',
                'principal': Decimal('300000.00'),
                'interest_rate': Decimal('11.50'),
                'tenure_months': 36,
                'status': 'pending',
                'approved_by': None,
                'approved_at': None,
                'applied_at': now - timedelta(days=1),
            },
            # Meera Joshi - Personal Loan (Closed / Completed)
            {
                'customer': created_customers[9],
                'account': accounts[14],
                'loan_type': 'personal',
                'principal': Decimal('150000.00'),
                'interest_rate': Decimal('12.00'),
                'tenure_months': 12,
                'status': 'closed',
                'approved_by': admin_user,
                'approved_at': now - timedelta(days=380),
                'applied_at': now - timedelta(days=385),
            },
        ]

        for l_data in loans_data:
            emi = Loan.calculate_emi(l_data['principal'], l_data['interest_rate'], l_data['tenure_months'])
            loan = Loan.objects.create(
                customer=l_data['customer'],
                account=l_data['account'],
                loan_type=l_data['loan_type'],
                principal=l_data['principal'],
                interest_rate=l_data['interest_rate'],
                tenure_months=l_data['tenure_months'],
                emi=emi,
                status=l_data['status'],
                approved_by=l_data['approved_by'],
                approved_at=l_data['approved_at'],
                applied_at=l_data['applied_at']
            )

            # If active or closed, record some monthly payments
            if loan.status in ('active', 'closed'):
                payments_count = 3 if loan.status == 'active' else 12
                for p_idx in range(payments_count):
                    p_time = loan.approved_at + timedelta(days=30 * (p_idx + 1))
                    LoanPayment.objects.create(
                        loan=loan,
                        amount=loan.emi,
                        paid_on=p_time,
                        status='paid'
                    )

        self.stdout.write(self.style.SUCCESS("Created 5 Loans and associated EMI payment schedules"))

        # 8. Create Audit Log entries
        AuditLog.objects.create(
            user=admin_user,
            action='ADMIN_LOGIN',
            table_name='users',
            record_id=str(admin_user.id),
            new_value={'ip': '127.0.0.1', 'status': 'success'}
        )
        AuditLog.objects.create(
            user=admin_user,
            action='LOAN_APPROVAL',
            table_name='loans',
            record_id='1',
            old_value={'status': 'pending'},
            new_value={'status': 'active', 'approved_by': 'admin'}
        )

        self.stdout.write(self.style.SUCCESS("Database seeding completed successfully!"))

