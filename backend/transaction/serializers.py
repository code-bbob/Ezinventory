from rest_framework import serializers
from .models import Vendor, Phone, Purchase, PurchaseTransaction,Sales, SalesTransaction,Scheme,Subscheme,Item, PriceProtection,PurchaseReturn, SalesReturn
from inventory.models import Brand
from django.db import transaction
from .models import VendorTransaction, EMIDebtor,EMIDebtorTransaction
from django.utils.timezone import localtime
from transaction.models import VendorTransaction
from alltransactions.models import Debtor, DebtorTransaction
from alltransactions.serializers import DebtorTransactionSerializer
from django.utils import timezone


class PurchaseSerializer(serializers.ModelSerializer):
    phone_name = serializers.SerializerMethodField(read_only=True)
    id = serializers.IntegerField(required=False)

    class Meta:
        model = Purchase
        fields = ['id','phone', 'imei_number', 'unit_price','phone_name','purchase_transaction','returned']
        read_only_fields = ['returned','purchase_transaction']
        
    def get_phone_name(self,obj):
        return obj.phone.name
    
# class PurchaseTransactionSerializer(serializers.ModelSerializer):
    
#     purchase = PurchaseSerializer(many=True)
#     vendor_name = serializers.SerializerMethodField(read_only=True)
#     date = serializers.DateTimeField()
   
#     class Meta:
#         model = PurchaseTransaction
#         # fields = ['id','date', 'vendor', 'vendor_name', 'total_amount', 'purchase', 'enterprise','bill_no','method']
#         fields = '__all__'

#     # def create(self, validated_data):
        
#     #     purchase_data = validated_data.pop('purchase')
#     #     purchase_transaction = PurchaseTransaction.objects.create(**validated_data)
#     #     for purchase in purchase_data:
#     #         with transaction.atomic():
#     #             purchaseobj = Purchase.objects.create(purchase_transaction=purchase_transaction, **purchase)
#     #             phone = purchaseobj.phone
#     #             print("phone is:", phone)
#     #             phone.refresh_from_db()
                
#     #             print("Phone is now:", phone)
#     #             print("Phone count is:", phone.count) 
#     #             phone.count = (phone.count + 1) if phone.count is not None else 1
#     #             phone.stock = (phone.stock + phone.selling_price) if phone.stock is not None else phone.selling_price
#     #             brand = phone.brand
#     #             brand.refresh_from_db()
#     #             brand.count = (brand.count + 1) if brand.count is not None else 1
#     #             brand.stock = (brand.stock + phone.selling_price) if brand.stock is not None else phone.selling_price
#     #             phone.save()
#     #             brand.save()
#     #             print("Phone saved with count:", phone.count)
#     #             phone.refresh_from_db()
#     #             brand.refresh_from_db()
#     #             print("Phone count after refreshed from db:", phone.count)
#     #             phone = Phone.objects.get(id=phone.id)
#     #             print("Also, phone count after .get(id) is:", phone.count) 
#     #             print("Brand saved:", brand.count) 


#     #     amount = purchase_transaction.calculate_total_amount()
#     #     vendor = purchase_transaction.vendor
#     #     VendorTransactionSerializer().create({
#     #         'vendor': vendor,
#     #         'date': purchase_transaction.date,
#     #         'amount': -amount,
#     #         'desc': f'Purchase made for transaction {purchase_transaction.bill_no}',
#     #         'method': purchase_transaction.method,
#     #         'purchase_transaction': purchase_transaction,
#     #         'enterprise': purchase_transaction.enterprise,
#     #         'branch': purchase_transaction.branch,
#     #         'type': 'base'
#     #     })

#     #     # Handle payment method -> create VendorTransactions if needed
#     #     method = purchase_transaction.method
#     #     if method == 'cash':
#     #         print("HERERERE")
#     #         vt = VendorTransactionSerializer().create({
#     #             'vendor': vendor,
#     #             'branch': purchase_transaction.branch,
#     #             'date': purchase_transaction.date,
#     #             'amount': purchase_transaction.total_amount,
#     #             'desc': 'Paid for purchase',
#     #             'method': 'cash',
#     #             'purchase_transaction': purchase_transaction,
#     #             'enterprise': purchase_transaction.enterprise,
#     #             'type':'payment'

#     #         })
#     #         print(vt)
#     #     elif method == 'cheque':
#     #         VendorTransactionSerializer().create({
#     #             'vendor': vendor,
#     #             'branch': purchase_transaction.branch,
#     #             'date': purchase_transaction.date,
#     #             'amount': purchase_transaction.total_amount,
#     #             'desc': 'Paid for purchase',
#     #             'method': 'cheque',
#     #             'cheque_number': purchase_transaction.cheque_number,
#     #             'cashout_date': purchase_transaction.cashout_date,
#     #             'purchase_transaction': purchase_transaction,
#     #             'enterprise': purchase_transaction.enterprise,
#     #             'type':'payment'
#     #         })

#     #     return purchase_transaction



#     @transaction.atomic
#     def create(self, validated_data):
        
#         purchase_data = validated_data.pop('purchase')
#         purchase_transaction = PurchaseTransaction.objects.create(**validated_data)
        
#         # Dictionary to store Phone objects already processed in this transaction
#         # This prevents re-fetching from the database if the same phone ID appears multiple times
#         processed_phones = {} 

#         for purchase_item in purchase_data: # Renamed to avoid conflict with 'purchase' model
#             phone_id = purchase_item['phone'] # Get the phone ID from the validated data

#             if phone_id not in processed_phones:
#                 # Fetch the phone object only if it hasn't been processed yet in this transaction
#                 phone = Phone.objects.get(id=phone_id.id)
#                 processed_phones[phone_id] = phone
#             else:
#                 # If already processed, use the in-memory object
#                 phone = processed_phones[phone_id]

#             purchaseobj = Purchase.objects.create(purchase_transaction=purchase_transaction, **purchase_item) # Pass the fetched phone object

#             print("Phone count before update:", phone.count) # Clarified print statement
#             phone.count = (phone.count + 1) if phone.count is not None else 1
#             phone.stock = (phone.stock + phone.selling_price) if phone.stock is not None else phone.selling_price
            
#             brand = phone.brand
#             brand.count = (brand.count + 1) if brand.count is not None else 1
#             brand.stock = (brand.stock + phone.selling_price) if brand.stock is not None else phone.selling_price
            
#             phone.save()
#             brand.save()
            
#             # Since you're within an atomic block and saving, the in-memory object
#             # should reflect the latest state. refreshing from db is good for verification,
#             # but if the problem persists, it means the database is not showing the latest state
#             # within the same transaction to subsequent gets.
#             phone.refresh_from_db() 
#             print("Phone count after save:", phone.count)
#             print("Brand saved:", brand.count) 

#         amount = purchase_transaction.calculate_total_amount()
#         vendor = purchase_transaction.vendor
#         VendorTransactionSerializer().create({
#             'vendor': vendor,
#             'date': purchase_transaction.date,
#             'amount': -amount,
#             'desc': f'Purchase made for transaction {purchase_transaction.bill_no}',
#             'method': purchase_transaction.method,
#             'purchase_transaction': purchase_transaction,
#             'enterprise': purchase_transaction.enterprise,
#             'branch': purchase_transaction.branch,
#             'type': 'base'
#         })

#         # Handle payment method -> create VendorTransactions if needed
#         method = purchase_transaction.method
#         if method == 'cash':
#             print("HERERERE")
#             vt = VendorTransactionSerializer().create({
#                 'vendor': vendor,
#                 'branch': purchase_transaction.branch,
#                 'date': purchase_transaction.date,
#                 'amount': purchase_transaction.total_amount,
#                 'desc': 'Paid for purchase',
#                 'method': 'cash',
#                 'purchase_transaction': purchase_transaction,
#                 'enterprise': purchase_transaction.enterprise,
#                 'type':'payment'

#             })
#             print(vt)
#         elif method == 'cheque':
#             VendorTransactionSerializer().create({
#                 'vendor': vendor,
#                 'branch': purchase_transaction.branch,
#                 'date': purchase_transaction.date,
#                 'amount': purchase_transaction.total_amount,
#                 'desc': 'Paid for purchase',
#                 'method': 'cheque',
#                 'cheque_number': purchase_transaction.cheque_number,
#                 'cashout_date': purchase_transaction.cashout_date,
#                 'purchase_transaction': purchase_transaction,
#                 'enterprise': purchase_transaction.enterprise,
#                 'type':'payment'
#             })

#         return purchase_transaction

    
# #     def update(self, instance, validated_data):
  
# # #check to see if the old_method was cash or cheque or credit
# # #if the method has changed then delete the previous transaction and create a new one
# # #if not and just ampunt has changed then update the transaction
# #         old_method = instance.method
# #         old_vendor = instance.vendor
# #         old_brand = old_vendor.brand
# #         old_total = instance.total_amount

# #         instance.vendor = validated_data.get('vendor', instance.vendor)
# #         instance.date = validated_data.get('date', instance.date)
# #         #print(instance.date)
# #         instance.enterprise = validated_data.get('enterprise', instance.enterprise)
# #         instance.total_amount = validated_data.get('total_amount', instance.total_amount)
# #         instance.bill_no = validated_data.get('bill_no', instance.bill_no)
# #         instance.method = validated_data.get('method', instance.method)
# #         instance.cheque_number = validated_data.get('cheque_number', instance.cheque_number)
# #         instance.cashout_date = validated_data.get('cashout_date', instance.cashout_date)
# #         instance.save()
# #         #print(instance.date)

# #         new_vendor = instance.vendor
# #         new_brand = new_vendor.brand
# #         new_method = instance.method

# #         purchase_data = validated_data.get('purchase')
# #         if purchase_data:
# #             existing_purchases = {purchase.id: purchase for purchase in instance.purchase.all()}
            
# #             for purchase_item in purchase_data:
# #                 purchase_id = purchase_item.get('id')
                
# #                 if purchase_id and purchase_id in existing_purchases:
# #                     purchase_instance = existing_purchases[purchase_id]

# #                     old_imei = purchase_instance.imei_number
# #                     new_imei = purchase_item.get('imei_number')
# #                     if old_imei != new_imei:
# #                         item = Item.objects.filter(imei_number=old_imei).first()
# #                         item.imei_number = new_imei
# #                         item.save()
# #                     new_phone = purchase_item.get('phone')
# #                     old_phone = purchase_instance.phone

# #                     if new_phone!=old_phone:
# #                         item = Item.objects.filter(imei_number=new_imei).first()
# #                         item.phone = new_phone
# #                         item.save()
# #                         old_phone.count = (old_phone.count - 1) if old_phone.count is not None else -1
# #                         old_phone.stock = (old_phone.stock - old_phone.selling_price) if old_phone.stock is not None else -old_phone.selling_price
# #                         old_phone.brand.count = (old_phone.brand.count - 1) if old_phone.brand.count is not None else -1
# #                         old_phone.brand.stock = (old_phone.brand.stock - old_phone.selling_price) if old_phone.brand.stock is not None else -old_phone.selling_price
# #                         old_phone.save()
# #                         old_phone.brand.save()
# #                         new_phone.refresh_from_db()
# #                         new_phone.count = (new_phone.count + 1) if new_phone.count is not None else 1
# #                         new_phone.stock = (new_phone.stock + new_phone.selling_price) if new_phone.stock is not None else new_phone.selling_price
# #                         new_phone.brand.count = (new_phone.brand.count + 1) if new_phone.brand.count is not None else 1
# #                         new_phone.brand.stock = (new_phone.brand.stock + new_phone.selling_price) if new_phone.brand.stock is not None else new_phone.selling_price
# #                         new_phone.save()
# #                         new_phone.brand.save()
                 
# #                     for attr, value in purchase_item.items():
# #                         setattr(purchase_instance, attr, value)
# #                     purchase_instance.save()
# #                     del existing_purchases[purchase_id]
# #                 else:
# #                     new_purchase = Purchase(purchase_transaction=instance, **purchase_item)
# #                     new_purchase.save()
# #                     phone = new_purchase.phone
# #                     phone.count = (phone.count + 1) if phone.count is not None else 1
# #                     phone.stock = (phone.stock + phone.selling_price) if phone.stock is not None else phone.selling_price
# #                     phone.save()
# #                     brand = phone.brand
# #                     brand.count = (brand.count + 1) if brand.count is not None else 1
# #                     brand.stock = (brand.stock + phone.selling_price) if brand.stock is not None else phone.selling_price
# #                     brand.save()


# #             for purchase in existing_purchases.values():
# #                 phone = purchase.phone
# #                 phone.count = (phone.count - 1) if phone.count is not None else -1
# #                 phone.stock = (phone.stock - phone.selling_price) if phone.stock is not None else -phone.selling_price
# #                 phone.save()
# #                 brand = phone.brand
# #                 brand.count = (brand.count - 1) if brand.count is not None else -1
# #                 brand.stock = (brand.stock - phone.selling_price) if brand.stock is not None else -phone.selling_price
# #                 brand.save()
# #                 purchase.delete()


# #         instance.total_amount = instance.calculate_total_amount()
# #         new_total_amount = instance.total_amount
# #         instance.save()
# #         old_vendor.refresh_from_db()
# #         new_vendor.refresh_from_db()
        
        
        
# #         if old_method != new_method or old_total != new_total_amount or old_vendor != new_vendor:
# #             # If method or amount has changed, delete the old payment transaction
# #             vtp = VendorTransaction.objects.filter(purchase_transaction=instance, type='payment').first()
# #             if vtp:
# #                 vtp.delete()
# #             vtb = VendorTransaction.objects.filter(purchase_transaction=instance, type='base').first()
# #             if vtb:
# #                 vtb.delete()
# #             new_vendor.refresh_from_db()
# #             old_vendor.refresh_from_db()
            
# #             # Create a new base transaction for the vendor
# #             VendorTransactionSerializer().create({
# #                 'vendor': new_vendor,
# #                 'date': instance.date,
# #                 'branch': instance.branch,
# #                 'enterprise': instance.enterprise,
# #                 'date': instance.date,
# #                 'amount': -new_total_amount,  # Negative for base transaction
# #                 'desc': f'Purchase made for transaction {instance.bill_no}',
# #                 'method': new_method,
# #                 'purchase_transaction': instance,
# #                 'type':'base'
# #             })

# #             # If the method is credit, we don't create a payment transaction
# #             if new_method == 'credit':
# #                 return instance

# #             # Create a new payment transaction if method is cash or cheque
# #             if new_method == 'cash':
# #                 VendorTransactionSerializer().create({
# #                     'vendor': new_vendor,
# #                     'branch': instance.branch,
# #                     'date' : instance.date,
# #                     'enterprise': instance.enterprise,
# #                     'date': instance.date,
# #                     'amount': new_total_amount,
# #                     'desc': 'Paid for purchase',
# #                     'method': 'cash',
# #                     'purchase_transaction': instance,
# #                     'type':'payment'
# #                 })
# #             elif new_method == 'cheque':
# #                 VendorTransactionSerializer().create({
# #                     'vendor': new_vendor,
# #                     'branch': instance.branch,
# #                     'enterprise': instance.enterprise,
# #                     'date': instance.date,
# #                     'amount': new_total_amount,
# #                     'desc': 'Paid for purchase',
# #                     'method': 'cheque',
# #                     'cheque_number': instance.cheque_number,
# #                     'cashout_date': instance.cashout_date,
# #                     'purchase_transaction': instance,
# #                     'type':'payment'
# #                 })

# #         return instance

#     @transaction.atomic
#     def update(self, instance, validated_data):
#         # Preserve old values for vendor transaction adjustments
#         old_method = instance.method
#         old_vendor = instance.vendor
#         old_total = instance.total_amount

#         # Update instance fields
#         instance.vendor = validated_data.get('vendor', instance.vendor)
#         instance.date = validated_data.get('date', instance.date)
#         instance.enterprise = validated_data.get('enterprise', instance.enterprise)
#         instance.bill_no = validated_data.get('bill_no', instance.bill_no)
#         instance.method = validated_data.get('method', instance.method)
#         instance.cheque_number = validated_data.get('cheque_number', instance.cheque_number)
#         instance.cashout_date = validated_data.get('cashout_date', instance.cashout_date)
#         instance.save()

#         # Prepare cache to avoid refetching phones
#         processed_phones = {}
#         def get_phone(p):
#             if p.id not in processed_phones:
#                 # Lock the row for update
#                 processed_phones[p.id] = Phone.objects.select_for_update().get(id=p.id)
#             return processed_phones[p.id]

#         # Handle nested purchase items
#         purchase_data = validated_data.get('purchase')
#         if purchase_data is not None:
#             existing = {p.id: p for p in instance.purchase.all()}

#             for item_data in purchase_data:
#                 pid = item_data.get('id')
#                 if pid and pid in existing:
#                     # Update existing purchase
#                     purchase_inst = existing.pop(pid)

#                     # IMEI update
#                     old_imei = purchase_inst.imei_number
#                     new_imei = item_data.get('imei_number')
#                     if old_imei != new_imei:
#                         itm = Item.objects.filter(imei_number=old_imei).first()
#                         if itm:
#                             itm.imei_number = new_imei
#                             itm.save()

#                     # Phone change: adjust counts on old and new
#                     old_phone = purchase_inst.phone
#                     new_phone = item_data.get('phone')
#                     if new_phone != old_phone:
#                         # Decrement old
#                         op = get_phone(old_phone)
#                         op.count = (op.count - 1) if op.count is not None else -1
#                         op.stock = (op.stock - op.selling_price) if op.stock is not None else -op.selling_price
#                         op.brand.count = (op.brand.count - 1) if op.brand.count is not None else -1
#                         op.brand.stock = (op.brand.stock - op.selling_price) if op.brand.stock is not None else -op.selling_price
#                         op.brand.save()
#                         op.save()

#                         # Increment new
#                         np = get_phone(new_phone)
#                         np.count = (np.count + 1) if np.count is not None else 1
#                         np.stock = (np.stock + np.selling_price) if np.stock is not None else np.selling_price
#                         np.brand.count = (np.brand.count + 1) if np.brand.count is not None else 1
#                         np.brand.stock = (np.brand.stock + np.selling_price) if np.brand.stock is not None else np.selling_price
#                         np.brand.save()
#                         np.save()

#                         purchase_inst.phone = np

#                     # Apply remaining fields
#                     for attr, val in item_data.items():
#                         setattr(purchase_inst, attr, val)
#                     purchase_inst.save()
#                 else:
#                     # New purchase item
#                     new_p = Purchase.objects.create(purchase_transaction=instance, **item_data)
#                     ph = get_phone(new_p.phone)
#                     ph.count = (ph.count + 1) if ph.count is not None else 1
#                     ph.stock = (ph.stock + ph.selling_price) if ph.stock is not None else ph.selling_price
#                     ph.brand.count = (ph.brand.count + 1) if ph.brand.count is not None else 1
#                     ph.brand.stock = (ph.brand.stock + ph.selling_price) if ph.brand.stock is not None else ph.selling_price
#                     ph.brand.save()
#                     ph.save()

#             # Remove deleted items
#             for removed in existing.values():
#                 ph = get_phone(removed.phone)
#                 ph.count = (ph.count - 1) if ph.count is not None else -1
#                 ph.stock = (ph.stock - ph.selling_price) if ph.stock is not None else -ph.selling_price
#                 ph.brand.count = (ph.brand.count - 1) if ph.brand.count is not None else -1
#                 ph.brand.stock = (ph.brand.stock - ph.selling_price) if ph.brand.stock is not None else -ph.selling_price
#                 ph.brand.save()
#                 ph.save()
#                 removed.delete()

#         # Recalculate total and save
#         instance.total_amount = instance.calculate_total_amount()
#         instance.save()

#         # Refresh vendor states
#         old_vendor.refresh_from_db()
#         instance.vendor.refresh_from_db()

#         # Adjust vendor transactions if needed
#         new_method = instance.method
#         new_total = instance.total_amount
#         if old_method != new_method or old_total != new_total or old_vendor != instance.vendor:
#             # Remove old transactions
#             vt = VendorTransaction.objects.filter(purchase_transaction=instance)
#             for v in vt:
#                 v.delete()
#             vendor = Vendor.objects.get(id=instance.vendor.id)
#             print("VENDOR IS ", vendor.name)
#             print("DUE IS ", vendor.due)
#             instance.vendor.refresh_from_db()
#             # Create base transaction
#             VendorTransactionSerializer().create({
#                 'vendor': instance.vendor,
#                 'date': instance.date,
#                 'branch': instance.branch,
#                 'enterprise': instance.enterprise,
#                 'amount': -new_total,
#                 'desc': f'Purchase made for transaction {instance.bill_no}',
#                 'method': new_method,
#                 'purchase_transaction': instance,
#                 'type': 'base'
#             })
#             # Create payment if not credit
#             if new_method in ['cash', 'cheque']:
#                 data = {
#                     'vendor': instance.vendor,
#                     'branch': instance.branch,
#                     'date': instance.date,
#                     'enterprise': instance.enterprise,
#                     'amount': new_total,
#                     'desc': 'Paid for purchase',
#                     'method': new_method,
#                     'purchase_transaction': instance,
#                     'type': 'payment'
#                 }
#                 if new_method == 'cheque':
#                     data.update({'cheque_number': instance.cheque_number, 'cashout_date': instance.cashout_date})
#                 VendorTransactionSerializer().create(data)

#         return instance


#     def get_vendor_name(self, obj):
#         return obj.vendor.name
    
#     def to_representation(self, instance):
#         representation = super().to_representation(instance)
#         representation['date'] = localtime(instance.date).strftime('%Y-%m-%d')
#         return representation

class PurchaseTransactionSerializer(serializers.ModelSerializer):
    purchase = PurchaseSerializer(many=True)
    vendor_name = serializers.SerializerMethodField(read_only=True)
    date = serializers.DateField()
    employee_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PurchaseTransaction
        fields = '__all__'

    def _get_locked_phone(self, phone_id, cache):
        """
        Fetch a Phone with select_for_update, caching to avoid redundant queries.
        """
        if phone_id not in cache:
            cache[phone_id] = Phone.objects.select_for_update().get(id=phone_id)
        return cache[phone_id]

    @transaction.atomic
    def create(self, validated_data):
        purchase_items = validated_data.pop('purchase', [])
        txn = PurchaseTransaction.objects.create(**validated_data)

        phones_cache = {}
        brands_cache = {}

        # Create each purchase and update stocks
        for item_data in purchase_items:
            phone_obj = self._get_locked_phone(item_data['phone'].id, phones_cache)
            Purchase.objects.create(purchase_transaction=txn, **item_data)

            # Update phone
            phone_obj.count = (phone_obj.count or 0) + 1
            phone_obj.stock = (phone_obj.stock or 0) + phone_obj.selling_price
            phone_obj.save()

            # Update brand
            brand_obj = phone_obj.brand
            if brand_obj.id not in brands_cache:
                # Already locked via phone FK
                brands_cache[brand_obj.id] = brand_obj
            brand = brands_cache[brand_obj.id]
            brand.count = (brand.count or 0) + 1
            brand.stock = (brand.stock or 0) + phone_obj.selling_price
            brand.save()

        desc = f'Purchase made for transaction {txn.bill_no}, Items:'


        for purchase in txn.purchase.all():
            desc += f' {purchase.phone.name} (IMEI: {purchase.imei_number}),'
        # Record base vendor transaction
        total = txn.calculate_total_amount()
        base_data = {
            'vendor': txn.vendor,
            'date': txn.date,
            'amount': -total,
            'desc': desc,
            'method': txn.method,
            'purchase_transaction': txn,
            'enterprise': txn.enterprise,
            'branch': txn.branch,
            'type': 'base',
        }
        VendorTransactionSerializer().create(base_data)

        # Record payment if cash/cheque
        if txn.method in ('cash', 'cheque'):
            pay_data = base_data.copy()
            pay_data['amount'] = total
            pay_data['desc'] = 'Paid for purchase'
            pay_data['type'] = 'payment'
            if txn.method == 'cheque':
                pay_data.update({
                    'cheque_number': txn.cheque_number,
                    'cashout_date': txn.cashout_date
                })
            VendorTransactionSerializer().create(pay_data)

        return txn

    @transaction.atomic
    def update(self, instance, validated_data):
        # Preserve old transaction info
        old_method = instance.method
        old_vendor = instance.vendor
        old_total = instance.total_amount
        old_date = instance.date

        # Update simple fields
        for field in ['vendor', 'date', 'enterprise', 'bill_no', 'method', 'cheque_number', 'cashout_date']:
            setattr(instance, field, validated_data.get(field, getattr(instance, field)))
        instance.save()

        # Prepare caches for phones and brands
        phones_cache = {}
        brands_cache = {}

        def get_phone_obj(phone_id):
            if phone_id not in phones_cache:
                phones_cache[phone_id] = Phone.objects.select_for_update().get(pk=phone_id)
            return phones_cache[phone_id]

        def get_brand_obj(brand_id):
            if brand_id not in brands_cache:
                brands_cache[brand_id] = Brand.objects.select_for_update().get(pk=brand_id)
            return brands_cache[brand_id]

        # Handle nested purchase list
        new_items = validated_data.get('purchase', [])
        existing = {p.id: p for p in instance.purchase.all()}

        # Process incoming items
        for data in new_items:
            pid = data.get('id')
            if pid and pid in existing:
                purchase_inst = existing.pop(pid)

                # Handle IMEI change
                new_imei = data.get('imei_number')
                if new_imei and new_imei != purchase_inst.imei_number:
                    Item.objects.filter(imei_number=purchase_inst.imei_number, phone=purchase_inst.phone).delete()
                    Item.objects.create(imei_number=new_imei, phone=purchase_inst.phone)

                # Handle phone swap
                new_phone = data.get('phone')
                old_phone = purchase_inst.phone
                imei = data.get('imei_number')
                item = Item.objects.filter(imei_number=imei).first()

                if new_phone and new_phone != old_phone:
                    # Decrement old phone
                    op = get_phone_obj(old_phone.id)
                    old_price = op.selling_price
                    op.count = (op.count or 0) - 1
                    op.stock = (op.stock or 0) - old_price
                    op.save()

                    ob = get_brand_obj(op.brand_id)
                    ob.count = (ob.count or 0) - 1
                    ob.stock = (ob.stock or 0) - old_price
                    ob.save()
                    print(ob.stock, "after decrementing")

                    # Increment new phone
                    np = get_phone_obj(new_phone.id)
                    new_price = np.selling_price
                    np.count = (np.count or 0) + 1
                    np.stock = (np.stock or 0) + new_price
                    np.save()

                    nb = get_brand_obj(np.brand_id)
                    nb.count = (nb.count or 0) + 1
                    nb.stock = (nb.stock or 0) + new_price
                    nb.save()
                    print(nb.stock, "after incrementing")

                    # Update item and purchase_inst
                    if item:
                        item.phone = np
                        item.save()
                    purchase_inst.phone = np

                # Update remaining fields
                for field, val in data.items():
                    if field not in ('id', 'phone','returned'):
                        setattr(purchase_inst, field, val)
                purchase_inst.save()

            else:
                # New purchase
                new_p = Purchase.objects.create(purchase_transaction=instance, **data)
                ph = get_phone_obj(new_p.phone.id)
                ph.count = (ph.count or 0) + 1
                ph.stock = (ph.stock or 0) + ph.selling_price
                ph.save()

                bd = get_brand_obj(ph.brand_id)
                bd.count = (bd.count or 0) + 1
                bd.stock = (bd.stock or 0) + ph.selling_price
                bd.save()

        # Remove deleted purchases
        for removed in existing.values():
            ph = get_phone_obj(removed.phone.id)
            ph.count = (ph.count or 0) - 1
            ph.stock = (ph.stock or 0) - ph.selling_price
            ph.save()

            bd = get_brand_obj(ph.brand_id)
            bd.count = (bd.count or 0) - 1
            bd.stock = (bd.stock or 0) - ph.selling_price
            bd.save()
            removed.delete()

        # Recalculate totals
        instance.total_amount = instance.calculate_total_amount()
        instance.save()

        # Refresh vendors
        old_vendor.refresh_from_db()
        instance.vendor.refresh_from_db()

        # Adjust vendor transactions
        new_method = instance.method
        new_total = instance.total_amount
        new_date = instance.date

        desc = f'Purchase made for transaction {instance.bill_no}, Items:'
        for purchase in instance.purchase.all():
            desc += f' {purchase.phone.name} (IMEI: {purchase.imei_number}),'

        if old_date != new_date:
            vts = VendorTransaction.objects.filter(purchase_transaction=instance)
            for vt in vts:
                vt.date = new_date
                vt.save()

        if old_method != new_method or old_total != new_total or old_vendor != instance.vendor:
            # Delete existing vendor txns
            for vt in VendorTransaction.objects.filter(purchase_transaction=instance):
                vt.delete()
            instance.vendor.refresh_from_db()

            # Base transaction
            base = {
                'vendor': instance.vendor,
                'date': instance.date,
                'branch': instance.branch,
                'enterprise': instance.enterprise,
                'amount': -new_total,
                'desc': desc,
                'method': new_method,
                'purchase_transaction': instance,
                'type': 'base',
            }
            VendorTransactionSerializer().create(base)

            # Payment transaction
            if new_method in ('cash', 'cheque'):
                pay = base.copy()
                pay['amount'] = new_total
                pay['desc'] = 'Paid for purchase'
                pay['type'] = 'payment'
                if new_method == 'cheque':
                    pay.update({'cheque_number': instance.cheque_number, 'cashout_date': instance.cashout_date})
                VendorTransactionSerializer().create(pay)

        # Link to sales
        for purchase in instance.purchase.all():
            sale = Sales.objects.filter(imei_number=purchase.imei_number).first()
            if sale:
                sale.checkit()

        return instance


    def get_vendor_name(self, obj):
            return obj.vendor.name


    def get_employee_name(self, obj):
        return obj.employee.user.name if obj.employee else None


class VendorSerializer(serializers.ModelSerializer):
    brand_name = serializers.SerializerMethodField(read_only=True)
    enterprise_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Vendor
        fields = ['id','name', 'brand', 'brand_name', 'due', 'enterprise', 'enterprise_name','branch']
    
    def get_brand_name(self, obj):
        return obj.brand.name
    
    def get_enterprise_name(self, obj):
        return obj.enterprise.name

class SalesSerializer(serializers.ModelSerializer):
    phone_name = serializers.SerializerMethodField(read_only=True)
    id = serializers.IntegerField(required=False)

    class Meta:
        model = Sales
        fields = ['id','phone', 'imei_number', 'unit_price','phone_name','returned', 'sales_transaction']
        read_only_fields = ['returned','sales_transaction']

    
    def get_phone_name(self,obj):
        return obj.phone.name

# class SalesTransactionSerializer(serializers.ModelSerializer):
#     sales = SalesSerializer(many=True)

#     class Meta:
#         model = SalesTransaction
#         fields = ['id','date', 'total_amount', 'sales','enterprise','name','phone_number','bill_no','branch']

#     @transaction.atomic
#     def create(self, validated_data):
#         sales_data = validated_data.pop('sales')
#         transaction = SalesTransaction.objects.create(**validated_data)
#         for data in sales_data:
#             sale = Sales.objects.create(sales_transaction=transaction, **data)
#             sale.phone.count = (sale.phone.count - 1) if sale.phone.count is not None else -1
#             sale.phone.stock = (sale.phone.stock - sale.phone.selling_price) if sale.phone.stock is not None else -sale.phone.selling_price
#             sale.phone.save()
#             sale.phone.brand.count = (sale.phone.brand.count - 1) if sale.phone.brand.count is not None else -1
#             sale.phone.brand.stock = (sale.phone.brand.stock - sale.phone.selling_price) if sale.phone.brand.stock is not None else -sale.phone.selling_price
#             sale.phone.brand.save()

#         transaction.calculate_total_amount()
#         return transaction
    
    
#     @transaction.atomic
#     def update(self, instance, validated_data):


#         instance.date = validated_data.get('date', instance.date)
#         instance.name = validated_data.get('name', instance.name)
#         instance.total_amount = validated_data.get('total_amount', instance.total_amount)
#         instance.bill_no = validated_data.get('bill_no',instance.bill_no)
#         instance.phone_number = validated_data.get('phone_number',instance.phone_number)

#         instance.save()

#         sales_data = validated_data.get('sales')
#         if sales_data:
#             existing_sales = {sale.id: sale for sale in instance.sales.all()}    
#             for sale_item in sales_data:
#                 sale_id = sale_item.get('id')
#                 if sale_id and sale_id in existing_sales:
#                     sales_instance = existing_sales[sale_id]
                    
#                     old_imei = sales_instance.imei_number
#                     new_imei = sale_item.get('imei_number')
#                     if old_imei != new_imei:
#                         item = Item.objects.create(imei_number = old_imei, phone = sales_instance.phone)
#                         old_phone = sales_instance.phone
#                         old_phone.count = (old_phone.count + 1) if old_phone.count is not None else 1
#                         old_phone.stock = (old_phone.stock + old_phone.selling_price) if old_phone.stock is not None else old_phone.selling_price
#                         old_phone.save()
#                         old_phone.brand.count = (old_phone.brand.count + 1) if old_phone.brand.count is not None else 1
#                         old_phone.brand.stock = (old_phone.brand.stock + old_phone.selling_price) if old_phone.brand.stock is not None else old_phone.selling_price
#                         old_phone.brand.save()
#                         new_phone = sale_item.get('phone')
#                         new_phone.count = (new_phone.count - 1) if new_phone.count is not None else -1
#                         new_phone.stock = (new_phone.stock - new_phone.selling_price) if new_phone.stock is not None else -new_phone.selling_price
#                         new_phone.save()
#                         new_phone.brand.count = (new_phone.brand.count - 1) if new_phone.brand.count is not None else -1
#                         new_phone.brand.stock = (new_phone.brand.stock - new_phone.selling_price) if new_phone.brand.stock is not None else -new_phone.selling_price
#                         new_phone.brand.save()


#                     for attr, value in sale_item.items():   
#                         setattr(sales_instance, attr, value)
#                     sales_instance.save()
#                     sales_instance.refresh_from_db()

#                     # sales_instance.phone.calculate_quantity()
#                     del existing_sales[sale_id]
#                 else:
#                     #print("Creating new sales instance")
#                     new_sale = Sales(sales_transaction=instance, **sale_item)
#                     new_sale.save()
#                     new_sale.phone.count = (new_sale.phone.count - 1) if new_sale.phone.count is not None else -1
#                     new_sale.phone.stock = (new_sale.phone.stock - new_sale.phone.selling_price) if new_sale.phone.stock is not None else -new_sale.phone.selling_price
#                     new_sale.phone.save()
#                     new_sale.phone.brand.count = (new_sale.phone.brand.count - 1) if new_sale.phone.brand.count is not None else -1
#                     new_sale.phone.brand.stock = (new_sale.phone.brand.stock - new_sale.phone.selling_price) if new_sale.phone.brand.stock is not None else -new_sale.phone.selling_price
#                     new_sale.phone.brand.save()


#             for sale in existing_sales.values():
#                 #print("Here")
#                 item = Item.objects.create(imei_number=sale.imei_number,phone=sale.phone)
#                 sale.phone.count = (sale.phone.count + 1) if sale.phone.count is not None else 1
#                 sale.phone.stock = (sale.phone.stock + sale.phone.selling_price) if sale.phone.stock is not None else sale.phone.selling_price
#                 sale.phone.save()
#                 sale.phone.brand.count = (sale.phone.brand.count + 1) if sale.phone.brand.count is not None else 1
#                 sale.phone.brand.stock = (sale.phone.brand.stock + sale.phone.selling_price) if sale.phone.brand.stock is not None else sale.phone.selling_price
#                 sale.phone.brand.save()
#                 sale.delete()

#         instance.total_amount = instance.calculate_total_amount()
#         instance.save()

#         sales = instance.sales.all()
#         for sale in sales:
#             print("3",end="")
#             sale.checkit()

#         return instance



#     def to_representation(self, instance):
#         representation = super().to_representation(instance)
#         # Format the date in 'YYYY-MM-DD' format for the response
#         representation['date'] = instance.date.strftime('%Y-%m-%d')
#         return representation
#     # def get_vendor_name(self, obj):
#     #     return obj.vendor.name


from django.db import transaction
from rest_framework import serializers

class SalesTransactionSerializer(serializers.ModelSerializer):
    sales = SalesSerializer(many=True)
    date = serializers.DateField()
    enterprise_name = serializers.SerializerMethodField(read_only=True)
    enterprise_address = serializers.SerializerMethodField(read_only=True)
    enterprise_contact = serializers.SerializerMethodField(read_only=True)
    employee_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = SalesTransaction
        fields = '__all__'

    def _get_locked_phone(self, phone_id, cache):
        """
        Fetch a Phone with select_for_update, caching to avoid redundant queries.
        """
        if phone_id not in cache:
            cache[phone_id] = Phone.objects.select_for_update().get(id=phone_id)
        return cache[phone_id]

    @transaction.atomic
    def create(self, validated_data):
        today_date = timezone.now().date()
        if validated_data.get('date') != today_date:
            if validated_data['employee'].role != 'Admin':
                raise serializers.ValidationError("SalesTransaction date must be today's date.")

        sales_data = validated_data.pop('sales', [])
        txn = SalesTransaction.objects.create(**validated_data)

        phones_cache = {}
        brands_cache = {}
        desc = f'Sales transaction {txn.bill_no} credited. Items:'

        # Create each sale and adjust inventory
        for item_data in sales_data:
            phone_obj = self._get_locked_phone(item_data['phone'].id, phones_cache)
            sale = Sales.objects.create(sales_transaction=txn, **item_data)
            desc += f" {sale.phone.name} (IMEI: {sale.imei_number}),"

            # Decrement phone
            phone_obj.count = (phone_obj.count or 0) - 1
            phone_obj.stock = (phone_obj.stock or 0) - phone_obj.selling_price
            phone_obj.save()

            # Decrement brand
            brand = phone_obj.brand
            if brand.id not in brands_cache:
                brands_cache[brand.id] = brand
            b = brands_cache[brand.id]
            b.count = (b.count or 0) - 1
            b.stock = (b.stock or 0) - phone_obj.selling_price
            b.save()

        # Calculate total
        txn.total_amount = txn.calculate_total_amount()
        txn.save()

        if txn.method == 'credit':
            debtor_id = txn.debtor.id
            debtor = Debtor.objects.select_for_update().get(id=debtor_id)
            DebtorTransactionSerializer().create({
                'debtor': debtor,
                'amount': -txn.credited_amount,
                'date': txn.date,
                'desc': desc,
                'sales_transaction': txn,
                'branch': txn.branch,
                'enterprise': txn.enterprise
            })
        
        if txn.method == 'emi':
            debtor_id = txn.emi_debtor.id
            debtor = EMIDebtor.objects.select_for_update().get(id=debtor_id)
            EMIDebtorTransactionSerializer().create({
                'debtor': debtor,
                'amount': -txn.credited_amount,
                'date': txn.date,
                'desc': desc,
                'sales_transaction': txn,
                'branch': txn.branch,
                'enterprise': txn.enterprise
            })
        return txn


    @transaction.atomic
    def update(self, instance, validated_data):
        # Extract nested data before updating instance
        old_date = instance.date
        old_method = instance.method
        old_total = instance.total_amount or 0
        old_debtor = instance.debtor
        old_credited_amount = instance.credited_amount or 0
        old_amount_paid = instance.amount_paid or 0
        sales_data = validated_data.pop('sales', [])
        
        # Update top-level fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        # Prepare caches for phones and brands
        phones_cache = {}
        brands_cache = {}

        def get_phone(p):
            return self._get_locked_phone(p.id, phones_cache)

        def get_brand(brand_id):
            if brand_id not in brands_cache:
                brands_cache[brand_id] = Brand.objects.select_for_update().get(pk=brand_id)
            return brands_cache[brand_id]

        existing = {s.id: s for s in instance.sales.all()}

        # Process incoming sales
        for data in sales_data:
            sid = data.get('id')
            print(f"Processing sale data: {data}")
            
            if sid and sid in existing:
                sale_inst = existing.pop(sid)
                print(f"Updating existing sale: {sale_inst.id}")
                print(f"Current IMEI: {sale_inst.imei_number}")
                
                # Handle IMEI change
                new_imei = data.get('imei_number')
                if new_imei and new_imei != sale_inst.imei_number:

                    Item.objects.filter(imei_number=new_imei).first().delete()

                    Item.objects.create(
                        imei_number=sale_inst.imei_number,
                        phone=sale_inst.phone
                    )

                    sale_inst.imei_number = new_imei    #This fucking fixes it because checkit deletes the sales with imei 



                # Handle phone swap
                new_phone = data.get('phone')
                old_phone = sale_inst.phone
                if new_phone and new_phone != old_phone:
                    # restore old phone counts
                    op = get_phone(old_phone)
                    old_price = op.selling_price
                    op.count = (op.count or 0) + 1
                    op.stock = (op.stock or 0) + old_price
                    op.save()
                    ob = get_brand(op.brand_id)
                    ob.count = (ob.count or 0) + 1
                    ob.stock = (ob.stock or 0) + old_price
                    ob.save()

                    # deduct new phone counts
                    np = get_phone(new_phone)
                    new_price = np.selling_price
                    np.count = (np.count or 0) - 1
                    np.stock = (np.stock or 0) - new_price
                    np.save()
                    nb = get_brand(np.brand_id)
                    nb.count = (nb.count or 0) - 1
                    nb.stock = (nb.stock or 0) - new_price
                    nb.save()

                    sale_inst.phone = np

                # Update other fields
                for field, val in data.items():
                    if field not in ('id', 'phone', 'imei_number','returned'):
                        setattr(sale_inst, field, val)
                sale_inst.save()

            else:
                # New sale
                sale_data = data.copy()
                sale_data.pop('id', None)
                new_sale = Sales.objects.create(sales_transaction=instance, **sale_data)
                ph = get_phone(new_sale.phone)
                # decrement new sale
                ph.count = (ph.count or 0) - 1
                ph.stock = (ph.stock or 0) - ph.selling_price
                ph.save()
                bd = get_brand(ph.brand_id)
                bd.count = (bd.count or 0) - 1
                bd.stock = (bd.stock or 0) - ph.selling_price
                bd.save()

        # Remove deleted sales
        for rem in existing.values():
            schemes = Scheme.objects.filter(sales__id=rem.id)
            if schemes:
                for scheme in schemes:
                    scheme.sales.remove(rem)
                    scheme.calculate_receivable()
            pps = PriceProtection.objects.filter(sales__id=rem.id)
            if pps:
                for pp in pps:
                    pp.sales.remove(rem)
                    pp.calculate_receivable()

            ph = get_phone(rem.phone)
            Item.objects.create(imei_number=rem.imei_number, phone=rem.phone)
            ph.count = (ph.count or 0) + 1
            ph.stock = (ph.stock or 0) + ph.selling_price
            ph.save()
            bd = get_brand(ph.brand_id)
            bd.count = (bd.count or 0) + 1
            bd.stock = (bd.stock or 0) + ph.selling_price
            bd.save()
            rem.delete()
        
        new_method = instance.method
        new_date = instance.date
        new_total = instance.total_amount or 0

        desc = f'Sales transaction {instance.bill_no} credited. Items:'
        for sale in instance.sales.all():
            desc += f" {sale.phone.name} (IMEI: {sale.imei_number}),"

        if old_date != new_date:
            dts = DebtorTransaction.objects.filter(sales_transaction=instance)
            for dt in dts:
                dt.date = new_date
                dt.save()

        if old_method != new_method or old_total != new_total or old_debtor != instance.debtor or old_credited_amount != instance.credited_amount or old_amount_paid != instance.amount_paid:
            dts = DebtorTransaction.objects.filter(sales_transaction=instance)
            for dt in dts:
                dt.delete()
            if instance.debtor:
                instance.debtor.refresh_from_db()
            edts = EMIDebtorTransaction.objects.filter(sales_transaction=instance)
            for edt in edts:
                edt.delete()
            if instance.emi_debtor:
                instance.emi_debtor.refresh_from_db()

            if instance.method == 'credit':
                # Base transaction
                base = {
                    'debtor': instance.debtor,
                    'date': instance.date,
                    'branch': instance.branch,
                    'enterprise': instance.enterprise,
                    'amount': -instance.credited_amount,
                    'desc': desc,
                    'sales_transaction': instance,
                }
                DebtorTransactionSerializer().create(base)
            
            elif instance.method == 'emi':
                base = {
                    'debtor': instance.emi_debtor,
                    'date': instance.date,
                    'branch': instance.branch,
                    'enterprise': instance.enterprise,
                    'amount': -instance.credited_amount,
                    'desc': desc,
                    'sales_transaction': instance,
                }
                EMIDebtorTransactionSerializer().create(base)

        # Recalculate total
        instance.total_amount = instance.calculate_total_amount()
        instance.save()
        return instance

    def get_enterprise_name(self, obj):
        return obj.enterprise.name if obj.enterprise else None

    def get_enterprise_address(self, obj):
        # Address may be null if not set
        try:
            return getattr(obj.enterprise, 'address', None)
        except Exception:
            return None

    def get_enterprise_contact(self, obj):
        try:
            return getattr(obj.enterprise, 'contact_phone', None)
        except Exception:
            return None

    def get_employee_name(self, obj):
        return obj.employee.user.name if obj.employee else None


class SubSchemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscheme
        fields = ['id','lowerbound','upperbound','cashback']
    
class SchemeSerializer(serializers.ModelSerializer):
    subscheme = SubSchemeSerializer(many=True)
    phone_name = serializers.SerializerMethodField(read_only = True)
    sold = serializers.SerializerMethodField(read_only=True)
    brand_name = serializers.SerializerMethodField(read_only=True)
    imeis = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = Scheme
        # fields = ['id','from_date','to_date','phone','enterprise','subscheme','phone_name','receivable','sold','brand','brand_name','status','branch']
        fields = '__all__'

    def create(self, validated_data):
        subschemes_data = validated_data.pop('subscheme')
        scheme = Scheme.objects.create(**validated_data)
        for subscheme_data in subschemes_data:
            Subscheme.objects.create(scheme=scheme, **subscheme_data)

        enterprise = scheme.enterprise


        sales = Sales.objects.filter(sales_transaction__enterprise = enterprise, sales_transaction__branch=scheme.branch, sales_transaction__date__gte=scheme.from_date,sales_transaction__date__lte=scheme.to_date )
        #print(sales)
        for sale in sales:
            sale.checkit()
        scheme.calculate_receivable()

        return scheme
    
    def update(self, instance, validated_data):
        with transaction.atomic():
            # Update Scheme fields
            for attr, value in validated_data.items():
                if attr != 'subscheme':
                    setattr(instance, attr, value)
            instance.save()

            # Handle Subschemes
            subschemes_data = validated_data.get('subscheme', [])
            existing_subschemes = {subscheme.id: subscheme for subscheme in instance.subscheme.all()}

            # Update or create subschemes
            for subscheme_data in subschemes_data:
                subscheme_id = subscheme_data.get('id')
                if subscheme_id and subscheme_id in existing_subschemes:
                    # Update existing subscheme
                    subscheme = existing_subschemes.pop(subscheme_id)
                    for attr, value in subscheme_data.items():
                        setattr(subscheme, attr, value)
                    subscheme.save()
                else:
                    # Create new subscheme
                    Subscheme.objects.create(scheme=instance, **subscheme_data)

            # Delete subschemes not present in the update data
            for subscheme in existing_subschemes.values():
                subscheme.delete()

            # Recalculate receivable if necessary
            enterprise = instance.enterprise.id


            sales = Sales.objects.filter(sales_transaction__enterprise = enterprise, sales_transaction__branch=instance.branch, sales_transaction__date__gte=instance.from_date,sales_transaction__date__lte=instance.to_date)
            other_sales = instance.sales.all()
            sales = sales.union(other_sales)
            print(sales)
            for sale in sales:
                sale.checkit()
            instance.calculate_receivable()


        return instance

    def get_imeis(self,obj):
        sales = obj.sales.all().order_by('-sales_transaction__date')
        list = []
        if sales:
            for sale in sales:
                list.append(sale.imei_number)
        return list

    
    def get_phone_name(self,obj):
        return obj.phone.name
    
    def get_sold(self,obj):
        return obj.sales.count()
    
    def get_brand_name(self,obj):
        return obj.brand.name


class PriceProtectionSerializer(serializers.ModelSerializer):
    phone_name = serializers.SerializerMethodField(read_only = True)
    sold = serializers.SerializerMethodField(read_only=True)
    brand_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PriceProtection
        fields = '__all__'


    def create(self, validated_data):
        pp = PriceProtection.objects.create(**validated_data)
        sales = Sales.objects.filter(sales_transaction__enterprise = pp.enterprise, sales_transaction__branch=pp.branch, sales_transaction__date__gte=pp.from_date,sales_transaction__date__lte=pp.to_date )
        for sale in sales:
            sale.checkit()
        pp.calculate_receivable()
        return pp
        


    def update(self, instance, validated_data):
        with transaction.atomic():
            # Update PriceProtection fields
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            
            instance.save()

            enterprise = instance.enterprise.id

            sales = Sales.objects.filter(sales_transaction__enterprise = enterprise, sales_transaction__branch=instance.branch,sales_transaction__date__gte=instance.from_date,sales_transaction__date__lte=instance.to_date )
            other_sales = instance.sales.all()
            sales = sales.union(other_sales)
            for sale in sales:
                sale.checkit()
                self.calculate_receivable(instance)
            instance.calculate_receivable()
            return instance
    
    def calculate_receivable(self, instance):
        # Calculate receivable based on price drop and number of sales
        sales_count = instance.sales.count()
        instance.receivable = instance.price_drop * sales_count
        instance.save()
    
    def get_phone_name(self,obj):
        return obj.phone.name
    
    def get_sold(self,obj):
        return obj.sales.count()
    
    def get_brand_name(self,obj):
        return obj.brand.name
    
class VendorBrandSerializer(serializers.ModelSerializer):
    count = serializers.SerializerMethodField(read_only = True)

    class Meta:
        model = Brand
        fields = '__all__'
    
    def get_count(self,obj):
        vendors = Vendor.objects.filter(enterprise = obj.enterprise, brand = obj).count()
        return vendors
    

class VendorTransactionSerializer(serializers.ModelSerializer):
    date = serializers.DateField()
    vendor_name = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = VendorTransaction
        fields = '__all__'

    def create(self, validated_data):
        vendor = validated_data['vendor']
        amount = validated_data['amount']
        vendor.due = (vendor.due - amount) if vendor.due is not None else -amount
        vendor.save()

        transaction = VendorTransaction.objects.create(**validated_data)
        return transaction
    
    def update(self, instance, validated_data):

        old_vendor = instance.vendor
        old_amount = instance.amount
        
        instance.vendor = validated_data.get('vendor', instance.vendor)
        instance.date = validated_data.get('date', instance.date)
        instance.amount = validated_data.get('amount', instance.amount)
        instance.desc = validated_data.get('desc', instance.desc)
        instance.method = validated_data.get('method', instance.method)
        instance.cheque_number = validated_data.get('cheque_number', instance.cheque_number)
        instance.cashout_date = validated_data.get('cashout_date', instance.cashout_date)
        instance.save()
        new_vendor = instance.vendor
        if old_vendor != new_vendor:
            old_vendor.due = (old_vendor.due + old_amount) if old_vendor.due is not None else old_amount
            new_vendor.due = (new_vendor.due - instance.amount) if new_vendor.due is not None else 0
            old_vendor.save()
            new_vendor.save()
        else:
            new_vendor.due = (new_vendor.due + old_amount - instance.amount) if new_vendor.due is not None else instance.amount
            new_vendor.save()
        return super().update(instance, validated_data)
    

    def get_vendor_name(self,obj):
        return obj.vendor.name

    
class PurchaseReturnSerializer(serializers.ModelSerializer):
   
    purchase_transaction = PurchaseTransactionSerializer(read_only=True)
    purchases = PurchaseSerializer(many=True,read_only=True) ##related name

    # Write-only fields for accepting the IDs in the request
    purchase_transaction_id = serializers.PrimaryKeyRelatedField(
        queryset=PurchaseTransaction.objects.all(),
        write_only=True,
        source='purchase_transaction'
    )
    purchase_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Purchase.objects.all(),
        write_only=True
    )


    class Meta:
        model = PurchaseReturn
        # fields = '__all__'
        fields = [
            'id',
            'date',
            'enterprise',
            'branch',
            'purchase_transaction',
            'purchase_transaction_id',  # for write
            'purchases',       # for read
            'purchase_ids'     # for write
        ]
    @transaction.atomic
    def create(self, validated_data):
        purchase_ids = validated_data.pop('purchase_ids', [])
        purchase_return = PurchaseReturn.objects.create(**validated_data)
        vendor = purchase_return.purchase_transaction.vendor

        total_unit_price = 0

        # Initialize memory cache
        phones_cache = {}
        brands_cache = {}

        for purchase in purchase_ids:
            purchase.purchase_return = purchase_return
            purchase.returned = True
            purchase.save()
            total_unit_price += purchase.unit_price

            # Use cache for phone
            phone_id = purchase.phone.id
            if phone_id not in phones_cache:
                phones_cache[phone_id] = Phone.objects.select_for_update().get(id=phone_id)
            product = phones_cache[phone_id]

            product.count = (product.count or 0) - 1
            product.stock = (product.stock or 0) - product.selling_price
            product.save()

            # Use cache for brand
            brand_id = product.brand.id
            if brand_id not in brands_cache:
                brands_cache[brand_id] = product.brand
            brand = brands_cache[brand_id]

            brand.count = (brand.count or 0) - 1
            brand.stock = (brand.stock or 0) - product.selling_price
            brand.save()

            # Remove item instance
            item = Item.objects.filter(imei_number=purchase.imei_number).first()
            if item:
                item.delete()

        # Create VendorTransaction
        VendorTransactionSerializer().create({
            'vendor': vendor,
            'date': purchase_return.date,
            'amount': total_unit_price,
            'desc': f'Purchase return for transaction {purchase_return.purchase_transaction.bill_no}',
            'method': purchase_return.purchase_transaction.method,
            'purchase_transaction': purchase_return.purchase_transaction,
            'enterprise': purchase_return.enterprise,
            'branch': purchase_return.branch,
            'type': 'return'
        })

        vendor.refresh_from_db()
        print(vendor.due)

        return purchase_return

    @transaction.atomic
    def delete(self, instance):
        purchase_ids = instance.purchases.all()
        vendor = instance.purchase_transaction.vendor
        total_unit_price = 0

        # Initialize in-memory caches
        phones_cache = {}
        brands_cache = {}

        for purchase in purchase_ids:
            purchase.returned = False
            purchase.save()
            total_unit_price += purchase.unit_price

            # Recreate item
            Item.objects.create(imei_number=purchase.imei_number, phone=purchase.phone)

            # Cache and update phone
            phone_id = purchase.phone.id
            if phone_id not in phones_cache:
                phones_cache[phone_id] = Phone.objects.select_for_update().get(id=phone_id)
            phone = phones_cache[phone_id]
            phone.count = (phone.count or 0) + 1
            phone.stock = (phone.stock or 0) + phone.selling_price

            # Cache and update brand
            brand_id = phone.brand.id
            if brand_id not in brands_cache:
                brands_cache[brand_id] = phone.brand
            brand = brands_cache[brand_id]
            brand.count = (brand.count or 0) + 1
            brand.stock = (brand.stock or 0) + phone.selling_price

        # Save phones and brands once each
        for phone in phones_cache.values():
            phone.save()
        for brand in brands_cache.values():
            brand.save()

        # Delete vendor transaction
        vt = VendorTransaction.objects.filter(purchase_transaction=instance.purchase_transaction, type="return").first()
        print(vt)
        if vt:
            vt.delete()

        # Delete purchase return record
        instance.delete()

        return instance

    


class EMIDebtorSerializer(serializers.ModelSerializer):

    brand_name = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = EMIDebtor
        fields = '__all__'

    def get_brand_name(self,obj):
        return obj.brand.name if obj.brand else None


class EMIDebtorTransactionSerializer(serializers.ModelSerializer):

    emi_debtor_name = serializers.SerializerMethodField(read_only=True)
    date = serializers.DateField()
    class Meta:
        model = EMIDebtorTransaction
        fields= '__all__'

    @transaction.atomic
    def create(self, validated_data):
        transaction = EMIDebtorTransaction.objects.create(**validated_data)
        debtor = transaction.debtor
        debtor.due = (debtor.due - transaction.amount) if debtor.due is not None else -transaction.amount
        debtor.save()
        return transaction
    
    @transaction.atomic
    def update(self, instance, validated_data):
        old_debtor = instance.debtor
        old_amount = instance.amount
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        instance.refresh_from_db()
        new_debtor = instance.debtor

        if old_debtor == new_debtor:
            new_debtor.due = (new_debtor.due - instance.amount + old_amount) if new_debtor.due is not None else -instance.amount + old_amount
            new_debtor.save()

        else:
            old_debtor.due = old_debtor.due + old_amount
            new_debtor.due = (new_debtor.due - instance.amount) if new_debtor.due is not None else -instance.amount
            old_debtor.save()
            new_debtor.save()

        return instance
    
    def get_emi_debtor_name(self, obj):
        return obj.debtor.name

class SalesReturnSerializer(serializers.ModelSerializer):

    sales_transaction = SalesTransactionSerializer(read_only=True)
    sales = SalesSerializer(many=True,read_only=True) ##related name

    # Write-only fields for accepting the IDs in the request
    sales_transaction_id = serializers.PrimaryKeyRelatedField(
        queryset=SalesTransaction.objects.all(),
        write_only=True,
        source='sales_transaction'
    )
    sales_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Sales.objects.all(),
        write_only=True
    )


    class Meta:
        model = PurchaseReturn
        # fields = '__all__'
        fields = [
            'id',
            'date',
            'enterprise',
            'branch',
            'sales_transaction',
            'sales_transaction_id',  # for write
            'sales',       # for read
            'sales_ids'     # for write
        ]

    @transaction.atomic
    def create(self, validated_data):

        sales_ids = validated_data.pop('sales_ids', [])

        # Create the SalesReturn instance
        sales_return = SalesReturn.objects.create(**validated_data)

        # Memory cache
        phones_cache = {}
        brands_cache = {}

        for sale in sales_ids:
            sale.sales_return = sales_return
            sale.returned = True
            sale.save()

            phone_id = sale.phone.id
            if phone_id not in phones_cache:
                phones_cache[phone_id] = Phone.objects.select_for_update().get(id=phone_id)
            product = phones_cache[phone_id]
            product.count = (product.count or 0) + 1
            product.stock = (product.stock or 0) + product.selling_price

            brand_id = product.brand.id
            if brand_id not in brands_cache:
                brands_cache[brand_id] = product.brand
            brand = brands_cache[brand_id]
            brand.count = (brand.count or 0) + 1
            brand.stock = (brand.stock or 0) + product.selling_price

            item = Item.objects.create(imei_number=sale.imei_number, phone=product)
            item.save()

        for phone in phones_cache.values():
            phone.save()
        for brand in brands_cache.values():
            brand.save()

        return sales_return


    @transaction.atomic
    def delete(self, instance):
        sales_ids = instance.sales.all()

        # Memory cache
        phones_cache = {}
        brands_cache = {}

        for sale in sales_ids:
            sale.returned = False
            sale.save()

            item = Item.objects.filter(imei_number=sale.imei_number, phone=sale.phone).first()
            if item:
                item.delete()

            phone_id = sale.phone.id
            if phone_id not in phones_cache:
                phones_cache[phone_id] = Phone.objects.select_for_update().get(id=phone_id)
            phone = phones_cache[phone_id]
            phone.stock = (phone.stock or 0) - phone.selling_price

            brand_id = phone.brand.id
            if brand_id not in brands_cache:
                brands_cache[brand_id] = phone.brand
            brand = brands_cache[brand_id]
            brand.count = (brand.count or 0) - 1
            brand.stock = (brand.stock or 0) - phone.selling_price

        for phone in phones_cache.values():
            phone.save()
        for brand in brands_cache.values():
            brand.save()

        instance.delete()
        return instance
