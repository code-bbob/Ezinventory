from django.contrib import admin
from .models import Vendor,Purchase,PurchaseTransaction,Subscheme,Scheme,PriceProtection ,Sales,SalesTransaction   ,PPItems,VendorTransaction, PurchaseReturn
# Register your models here.

admin.site.register(Vendor)
admin.site.register(Purchase)
admin.site.register(PurchaseTransaction)
admin.site.register(Scheme)
admin.site.register(Subscheme)
admin.site.register(PriceProtection)
admin.site.register(Sales)
admin.site.register(SalesTransaction)
admin.site.register(PPItems)
admin.site.register(VendorTransaction)
admin.site.register(PurchaseReturn)
