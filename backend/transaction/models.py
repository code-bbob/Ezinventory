from django.db import models
from inventory.models import Brand, Phone,Item
from enterprise.models import Enterprise
from django.core.validators import MinLengthValidator
from django.db import transaction
from alltransactions.models import Debtor, DebtorTransaction

class Vendor(models.Model):
    name = models.CharField(max_length=255)
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE)
    due = models.FloatField(null=True, blank=True, default=0)
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    cashback = models.FloatField(null=True,blank=True)
    branch = models.ForeignKey('enterprise.Branch', on_delete=models.CASCADE, related_name='vendor_branch',null=True,blank=True)

    def __str__(self):
        return f"{self.name} - {self.branch.name if self.branch else 'Unknown Branch'} at {self.enterprise.name}"

class PurchaseTransaction(models.Model):

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('expired', 'Expired'),
    ]
    date = models.DateField()
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE)
    total_amount = models.FloatField(null=True, blank=True)
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    bill_no = models.CharField(max_length=255,null=True)
    method = models.CharField(max_length=10,choices=[('cash','Cash'),('cheque','Cheque'),('credit','Credit')],default='credit')
    cheque_number = models.CharField(max_length=255,null=True,blank=True)
    cashout_date = models.DateField(null=True)
    branch = models.ForeignKey('enterprise.Branch', on_delete=models.CASCADE, related_name='purchase_transaction_branch',null=True,blank=True)
    employee = models.ForeignKey('enterprise.Employee', on_delete=models.SET_NULL, null=True, blank=True, related_name='purchase_transactions')

    def calculate_total_amount(self):
        total = sum(purchase.unit_price for purchase in self.purchase.all())
        self.total_amount = total
        self.save()
        return self.total_amount

    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
    def delete(self, *args, **kwargs):
        for purchase in self.purchase.all():
            purchase.delete()  # This will trigger the custom delete logic in Purchase
        super().delete(*args, **kwargs)
    
    def __str__(self):
        return f"Transaction on {self.date} with {self.vendor} - {self.branch.name if self.branch else 'Unknown Branch'} at {self.enterprise.name}"

class PurchaseReturn(models.Model):
    date = models.DateField(auto_now_add=True)
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    purchase_transaction = models.ForeignKey(PurchaseTransaction, on_delete=models.CASCADE,related_name='purchase_return')
    branch = models.ForeignKey('enterprise.Branch', on_delete=models.CASCADE, related_name='purchase_return_branch',null=True,blank=True)
    # phone = models.ForeignKey(Phone, on_delete=models.CASCADE)
    # imei_number = models.CharField(max_length=15)
    # purchase = models.ForeignKey(Purchase,related_name='purchase_return', on_delete=models.CASCADE,blank=True)
    # desc = models.CharField(max_length=50)

    def __str__(self):
        return f"Purchase Return {self.pk} - {self.branch.name if self.branch else 'Unknown Branch'} at {self.enterprise.name}"


class Purchase(models.Model):
    phone = models.ForeignKey(Phone, on_delete=models.CASCADE)
    # quantity = models.IntegerField()
    imei_number = models.CharField(max_length=15,validators=[MinLengthValidator(15)])
    unit_price = models.FloatField()
    purchase_transaction = models.ForeignKey(PurchaseTransaction, related_name="purchase", on_delete=models.CASCADE) ###relatedname here 
    returned = models.BooleanField(default=False)

    purchase_return = models.ForeignKey(
        PurchaseReturn,
        on_delete=models.SET_NULL,   # or CASCADE
        null=True,
        blank=True,
        related_name='purchases'
    )

    def __str__(self):
        return f" {self.phone} @ {self.unit_price} - {self.purchase_transaction.branch.name if self.purchase_transaction.branch else 'Unknown Branch'} at {self.purchase_transaction.enterprise.name}"

    def save(self, *args, **kwargs):
        if self.pk is None:  # Only update stock for new purchases
            if isinstance(self.phone, int):
                phone = Phone.objects.get(id=self.phone)
            else:
                phone = self.phone
            
            item = Item.objects.create(imei_number = self.imei_number,phone=self.phone)
            phone.save()

        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        item = Item.objects.filter(imei_number=self.imei_number).first()
        if item:
            item.delete()
        super().delete(*args, **kwargs)


class SalesTransaction(models.Model):
    date = models.DateField()
    # vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE)
    name = models.CharField(max_length=255,null=True,blank=True)
    phone_number = models.CharField(max_length=10,null=True)
    total_amount = models.FloatField(null=True, blank=True)
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    bill_no = models.CharField(max_length=255,null = True)
    branch = models.ForeignKey('enterprise.Branch', on_delete=models.CASCADE, related_name='sales_transaction_branch',null=True,blank=True)
    discount = models.FloatField(null=True,blank=True,default=0)
    subtotal = models.FloatField(null=True,blank=True)
    method = models.CharField(max_length=20,choices=(('cash','cash'),('online','online'),('card','card'),('credit','credit'),('emi','emi')),default='cash')
    debtor = models.ForeignKey(Debtor, on_delete=models.CASCADE, null=True, blank=True, related_name='sales_transaction')
    credited_amount = models.FloatField(null=True,blank=True,default=0)
    amount_paid = models.FloatField(null=True,blank=True,default=0)
    emi_debtor = models.ForeignKey('transaction.EMIDebtor', on_delete=models.CASCADE, null=True, blank=True, related_name='sales_transaction_emi',default=None)
    employee = models.ForeignKey('enterprise.Employee', on_delete=models.SET_NULL, null=True, blank=True, related_name='sales_transactions')

    def calculate_total_amount(self):
        total = sum(sale.unit_price for sale in self.sales.all())
        if self.discount:
            total = total - self.discount 
        self.total_amount = total
        self.save()
        return self.total_amount    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Sale on {self.date} to {self.name if self.name else 'Unknown Customer'} - {self.branch.name if self.branch else 'Unknown Branch'} at {self.enterprise.name}"

class SalesReturn(models.Model):
    date = models.DateField(auto_now_add=True)
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    sales_transaction = models.ForeignKey(SalesTransaction, on_delete=models.CASCADE,related_name='sales_return')
    branch = models.ForeignKey('enterprise.Branch', on_delete=models.CASCADE, related_name='sales_return_branch',null=True,blank=True)

    def __str__(self):
        return f"Sales Return {self.pk} - {self.branch.name if self.branch else 'Unknown Branch'} at {self.enterprise.name}"

class Sales(models.Model):
    phone = models.ForeignKey(Phone, on_delete=models.CASCADE)
    imei_number = models.CharField(max_length=15,validators=[MinLengthValidator(15)])
    unit_price = models.FloatField()
    profit = models.FloatField(null=True,blank=True)
    sales_transaction = models.ForeignKey(SalesTransaction, related_name="sales", on_delete=models.CASCADE) ###relatedname here esma j xa uta serializer ma tei nai hunu prxa
    returned = models.BooleanField(default=False)
    sales_return = models.ForeignKey(
        SalesReturn,
        on_delete=models.SET_NULL,   # or CASCADE
        null=True,
        blank=True,
        related_name='purchases'
    )

    def __str__(self):
        return f"{self.phone} @ {self.unit_price} - {self.sales_transaction.branch.name if self.sales_transaction.branch else 'Unknown Branch'} at {self.sales_transaction.enterprise.name}"

    def save(self, *args, **kwargs):
        if self.pk:
            self.checkit()
            super().save(*args, **kwargs)
        if self.pk is None:  # Only update stock for new purchases
            print("HERE checking")
            self.checkit()
            purchase = Purchase.objects.filter(imei_number = self.imei_number).first()
            if purchase:
                self.profit = self.unit_price - purchase.unit_price
            self.save()

    def checkit(self, *args, **kwargs):
        if not self.pk:
            super().save(*args, **kwargs)
        
        print("Checking schemes and price protection for sales id:", self.pk)

        prev_schemes = Scheme.objects.filter(sales=self)
        
        if prev_schemes.exists():
            for prev_scheme in prev_schemes:
                if self in prev_scheme.sales.all():
                    prev_scheme.sales.remove(self)
                    prev_scheme.calculate_receivable()
                    prev_scheme.save()

        schemes = Scheme.objects.filter(
            phone=self.phone, 
            from_date__lte=self.sales_transaction.date, 
            to_date__gte=self.sales_transaction.date,
            enterprise=self.sales_transaction.enterprise,
            branch=self.sales_transaction.branch
        )
        
        print("For sale id:", self.pk, "found schemes:", schemes)

        # Remove previous schemes if they exist

        if schemes.exists():
            for scheme in schemes:
                scheme.sales.add(self)  # Now the sales instance has a valid pk
                scheme.calculate_receivable()
                scheme.save()


        purchase_date = Purchase.objects.filter(imei_number = self.imei_number, purchase_transaction__branch=self.sales_transaction.branch).first().purchase_transaction.date
        pps = PriceProtection.objects.filter(enterprise=self.sales_transaction.enterprise,branch=self.sales_transaction.branch, phone=self.phone, from_date__lte=self.sales_transaction.date, to_date__gte=self.sales_transaction.date)
        prev_pps = PriceProtection.objects.filter(sales=self)
        print("For sale id:", self.pk, "found price protections:", pps)
        if prev_pps.exists():
            for pp in prev_pps:
                pp.sales.remove(self)
                pp.calculate_receivable()

        pps = pps.filter(from_date__gte = purchase_date)
        print("HERE for sale id:", self.pk, "filtered price protections:", pps, "with purchase date:", purchase_date, "from purchase transaction:", Purchase.objects.filter(imei_number = self.imei_number).first().purchase_transaction.id)
        if pps.exists():
            for pp in pps:
                pp.sales.add(self)
                pp_item = PPItems.objects.create(pp=pp, phone=self.phone,imei_number = self.imei_number)
                pp_item.save()
                pp.save()
                print("PP Item created for sale id:", self.pk, "with PP id:", pp.id, "and IMEI:", self.imei_number)
                pp.calculate_receivable()

        #FINALLY, DELETE THE ITEM
        item = Item.objects.filter(imei_number = self.imei_number).first()
        if item:
            item.delete()
        super().save(*args, **kwargs)  # Save again after processing the schemes and pp


class Scheme(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('expired', 'Expired'),
    ]
    from_date = models.DateField()
    to_date = models.DateField()
    phone = models.ForeignKey(Phone,on_delete=models.CASCADE, related_name='scheme_phones')
    sales = models.ManyToManyField(Sales,related_name="scheme",blank=True)  #error was here
    enterprise = models.ForeignKey(Enterprise,on_delete=models.CASCADE,related_name='scheme_enterprise')
    receivable = models.IntegerField(null = True,blank=True,default=0)
    brand = models.ForeignKey(Brand, related_name="scheme_brand", on_delete=models.CASCADE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    branch = models.ForeignKey('enterprise.Branch', on_delete=models.CASCADE, related_name='scheme_branch',null=True,blank=True)

    def calculate_receivable(self):
        sales = self.sales.all()
        count = sales.count()
        subscheme = self.subscheme.filter(lowerbound__lte=count, upperbound__gte=count).first()
        if subscheme:
            self.receivable = subscheme.cashback * count
        else:
            self.receivable = 0
        self.save()
    
    def __str__(self):
        return f"{self.phone} from {self.from_date} to {self.to_date} - {self.branch.name if self.branch else 'Unknown Branch'} at {self.enterprise.name}"


class Subscheme(models.Model):
    lowerbound = models.IntegerField()
    upperbound = models.IntegerField()
    cashback = models.FloatField()
    scheme = models.ForeignKey(Scheme,on_delete=models.CASCADE, related_name='subscheme') #related name here


    def __str__(self):
        return f"{self.lowerbound} to {self.upperbound} => {self.cashback}"


class PriceProtection(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('expired', 'Expired'),
    ]
    from_date = models.DateField(null=True)
    to_date = models.DateField(null = True)
    price_drop = models.FloatField()
    sales = models.ManyToManyField(Sales, related_name="priceprotection_sales",blank=True)
    phone = models.ForeignKey(Phone,related_name="priceprotection_phone",on_delete=models.CASCADE)
    enterprise = models.ForeignKey(Enterprise,on_delete=models.CASCADE,related_name='pp_enterprise')
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name='pp_brand')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    receivable = models.FloatField(null=True,blank=True,default=0)
    branch = models.ForeignKey('enterprise.Branch', on_delete=models.CASCADE, related_name='price_protection_branch',null=True,blank=True)

    def __str__(self):
        return f"Price Protection {self.pk} - {self.phone.name} from {self.from_date} to {self.to_date} - {self.branch.name if self.branch else 'Unknown Branch'} at {self.enterprise.name}"

    def calculate_receivable(self):
        # Calculate receivable based on price drop and number of sales
        sales_count = self.sales.count()
        self.receivable = self.price_drop * sales_count
        self.save()

class PPItems(models.Model):
    pp = models.ForeignKey(PriceProtection, related_name="pp_item",on_delete=models.CASCADE)
    phone = models.ForeignKey(Phone,related_name="pp_item_phone", on_delete = models.CASCADE)
    imei_number = models.CharField(max_length=15,validators=[MinLengthValidator(15)])
    cashback = models.FloatField(blank=True,null=True)

    def save(self,*args, **kwargs):
        super().save(*args, **kwargs)  # Save again after processing the schemes and pp

    def __str__(self):
        return f"PPItem {self.pk} - {self.phone.name} @ {self.cashback} - {self.pp.branch.name if self.pp.branch else 'Unknown Branch'} at {self.pp.enterprise.name}"


class VendorTransaction(models.Model):
    date = models.DateField()
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE,related_name="vendor_transaction")
    amount = models.FloatField(null=True, blank=True)
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    cheque_number = models.CharField(max_length=10,null=True,blank=True)
    cashout_date = models.DateField(null=True)
    method = models.CharField(max_length=10,choices=[('cash','Cash'),('cheque','Cheque')],default='cheque')
    desc = models.TextField(null=True,blank=True)
    purchase_transaction = models.ForeignKey(PurchaseTransaction, on_delete=models.CASCADE,related_name="vendor_transaction",null=True,blank=True)
    branch = models.ForeignKey('enterprise.Branch', on_delete=models.CASCADE, related_name='vendor_transaction_branch',null=True,blank=True)
    base = models.BooleanField(default=False)
    type = models.CharField(max_length=20,choices=(('base','base'),('return','return'),('payment','payment')),default='base')
    due = models.FloatField(null=True, blank=True, default=0)
    
    @transaction.atomic
    def delete(self, *args, **kwargs):
        self.vendor.due = self.vendor.due + self.amount
        self.vendor.save() 
        super().delete(*args, **kwargs)

    def __str__(self):
        return f"Vendor Transaction {self.pk} - {self.vendor.name} on {self.date} - {self.branch.name if self.branch else 'Unknown Branch'} at {self.enterprise.name}"


class EMIDebtor(models.Model):
    
    name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=10, null=True, blank=True)
    due = models.FloatField(default=0)
    branch = models.ForeignKey('enterprise.Branch', on_delete=models.CASCADE, related_name='emi_branch')
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE, related_name='emi_enterprise')
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name='emi_brand',null=True,blank=True)

    def __str__(self):
        return f"EMI Debtor {self.pk} - {self.name} - {self.branch.name if self.branch else 'Unknown Branch'} at {self.enterprise.name}"

class EMIDebtorTransaction(models.Model):
    debtor = models.ForeignKey(EMIDebtor, on_delete=models.CASCADE, related_name='emi_transactions')
    date = models.DateField()
    amount = models.FloatField()
    method = models.CharField(max_length=20, choices=[('cash', 'Cash'), ('cheque', 'Cheque'), ('bank_transfer', 'Bank Transfer')], default='cash')
    cheque_number = models.CharField(max_length=10, null=True, blank=True)
    cashout_date = models.DateField(null=True, blank=True)
    branch = models.ForeignKey('enterprise.Branch', on_delete=models.CASCADE, related_name='emi_transaction_branch',null=True,blank=True)
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE, related_name='emi_transaction_enterprise')
    sales_transaction = models.ForeignKey(SalesTransaction, on_delete=models.CASCADE, null=True, blank=True, related_name='emi_sales_transaction')  
    desc = models.TextField(null=True, blank=True)
    due = models.FloatField(null=True, blank=True, default=0)
    def __str__(self):
        return f"EMI Transaction of {self.amount} for {self.debtor.name} on {self.date} - {self.branch.name if self.branch else 'Unknown Branch'} at {self.enterprise.name}"

    @transaction.atomic
    def delete(self, *args, **kwargs):
        self.debtor.due = self.debtor.due + self.amount
        self.debtor.save()
        super().delete(*args, **kwargs)