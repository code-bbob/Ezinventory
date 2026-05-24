from django.db import models
from enterprise.models import Enterprise
from django.core.validators import MinLengthValidator


# Create your models here.

class Brand(models.Model):
    name = models.CharField(max_length=20)
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE, related_name="brand")
    stock = models.FloatField(null=True,blank=True,default=0)
    count = models.IntegerField(null=True,blank=True,default=0)
    branch = models.ForeignKey('enterprise.Branch', on_delete=models.CASCADE, related_name='inventory_brand', null=True, blank=True)
    def __str__(self):
        return f"Brand {self.pk} - {self.name} at {self.branch.name if self.branch else 'Unknown Branch'} of {self.enterprise.name}"

class Phone(models.Model):
    name = models.CharField(max_length=30)
    count = models.IntegerField(null=True,blank=True,default=0)
    stock = models.FloatField(null=True,blank=True,default=0)
    cost_price = models.FloatField(null=True,blank=True,default=0)
    selling_price = models.FloatField(null=True,blank=True,default=0)
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE)
    branch = models.ForeignKey('enterprise.Branch',on_delete=models.CASCADE, related_name='inventory_phone', null=True, blank=True)
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE, related_name='inventory_phone',null=True, blank=True)

    def __str__(self):
        return f"Phone {self.pk} - {self.name}"

    # def save(self, *args, **kwargs):
    #     if self.pk is None:
    #         super().save(*args, **kwargs)
 
    #     # Call save again to update the quantity field
    #     super().save()


    # def calculate_quantity(self):
    #     quantity = Item.objects.filter(phone=self).count()
    #     self.count = quantity
    #     self.save()

class Item(models.Model):
    imei_number = models.CharField(max_length=15,validators=[MinLengthValidator(15)])
    phone = models.ForeignKey(Phone, related_name="item",on_delete=models.CASCADE)
    def __str__(self):
        return f"Item {self.imei_number} - "

