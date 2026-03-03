# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Notifications', '0005_alter_notification_type'),
    ]

    operations = [
        migrations.AlterField(
            model_name='notification',
            name='type',
            field=models.CharField(
                choices=[
                    ('SUB_EXPIRING', 'Subscription Expiring'),
                    ('SUB_EXPIRED', 'Subscription Expired'),
                    ('SUB_RENEWED', 'Subscription Renewed'),
                    ('COINS_ADDED', 'Coins Added'),
                    ('NEW_POST', 'New Post'),
                    ('ROLE_CHANGED', 'Role Changed'),
                    ('ACCOUNT_BLOCKED', 'Account Blocked'),
                    ('BOOK_APPROVED', 'Book Submission Approved'),
                    ('BOOK_REJECTED', 'Book Submission Rejected'),
                ],
                max_length=50,
            ),
        ),
    ]
