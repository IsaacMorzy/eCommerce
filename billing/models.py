import stripe

from django.conf import settings
from django.db import models
from django.db.models.signals import post_save, pre_save

from accounts.models import GuestEmail


User = settings.AUTH_USER_MODEL

stripe.api_key = getattr(settings, 'STRIPE_API_KEY')


class BillingProfileManager(models.Manager):
    def new_or_get(self, request):
        guest_email_id = request.session.get('guest_email_id')
        obj = None
        created = False
        if request.user.is_authenticated():
            obj, created = self.model.objects.get_or_create(
                user=request.user,
                email=request.user.email
            )

        elif guest_email_id is not None:
            guest_email_obj = GuestEmail.objects.get(id=guest_email_id)
            obj, created = self.model.objects.get_or_create(
                email=guest_email_obj.email
            )
        else:
            pass
        return obj, created


class BillingProfile(models.Model):
    user = models.OneToOneField(User, null=True, blank=True)
    email = models.EmailField()
    active = models.BooleanField(default=True)
    updated = models.DateTimeField(auto_now=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    customer_id = models.CharField(max_length=120, null=True, blank=True)
    objects = BillingProfileManager()

    def __str__(self):
        return self.email


def billing_profile_created_receiver(sender, instance, *args, **kwargs):
    if not instance.customer_id and instance.email:
        print("ACTUAL API REQUEST: Send to stripe/braintree to return new ID")
        customer = stripe.Customer.create(
            email=instance.email
        )
        print(customer)
        instance.customer_id = customer.id
        instance.save()


pre_save.connect(billing_profile_created_receiver, sender=BillingProfile)


def user_created_receiver(sender, instance, created, *args, **kwargs):
    if created and instance.email:
        BillingProfile.objects.get_or_create(
            user=instance,
            email=instance.email
        )


post_save.connect(user_created_receiver, sender=User)
