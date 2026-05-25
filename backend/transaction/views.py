from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import PurchaseTransaction, Vendor, Purchase, Scheme,PriceProtection, PurchaseReturn, SalesReturn
from .serializers import EMIDebtorTransactionSerializer, PurchaseTransactionSerializer, SalesReturnSerializer, VendorSerializer,SalesTransactionSerializer,SalesSerializer,Sales,SalesTransaction,SchemeSerializer,PurchaseSerializer,PurchaseTransactionSerializer, PriceProtectionSerializer, VendorBrandSerializer,PurchaseReturnSerializer,EMIDebtorSerializer, SalesReturnSerializer
from inventory.serializers import BrandSerializer
from rest_framework.permissions import IsAuthenticated
from inventory.models import Item,Brand,Phone
from datetime import date, datetime, time
from django.utils.dateparse import parse_date
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db import models
from rest_framework import generics
from django.utils import timezone
from .models import VendorTransaction,EMIDebtorTransaction,EMIDebtor
from .serializers import VendorTransactionSerializer
from django.db.models import Sum
from django.db.models.functions import ExtractWeekDay
from django.utils.timezone import make_aware,localtime
from django.db import transaction
from alltransactions.models import DebtorTransaction, Debtor
from django.db.models import Q
class PurchaseTransactionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, branch=None):
        user = request.user
        enterprise = user.employee.enterprise
        search = request.GET.get('search')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        transactions = PurchaseTransaction.objects.filter(enterprise=enterprise)
        if branch:
            transactions = transactions.filter(branch=branch)
        if search:
            phone_transactions = transactions.filter(purchase__phone__name__icontains = search)
            vendor_trasactions = transactions.filter(vendor__name__icontains = search)
            imei_transactions = transactions.filter(purchase__imei_number__icontains = search)
            bill_transactions = transactions.filter(bill_no__icontains = search)
            transactions = phone_transactions.union(vendor_trasactions,imei_transactions,bill_transactions)
        
        if start_date and end_date:
            start_date = parse_date(start_date)
            end_date = parse_date(end_date)

        if start_date and end_date:
            start_date = datetime.combine(start_date, datetime.min.time())
            end_date = datetime.combine(end_date, datetime.max.time())
            
            transactions = PurchaseTransaction.objects.filter(
                date__range=(start_date, end_date)
            )

        transactions = transactions.order_by('-date','-id')


        paginator = PageNumberPagination()
        paginator.page_size = 5  # Set the page size here
        paginated_transactions = paginator.paginate_queryset(transactions, request)
        current_page = paginator.page.number if paginated_transactions else None
        total_pages = paginator.page.paginator.num_pages if paginated_transactions else None

        serializer = PurchaseTransactionSerializer(paginated_transactions, many=True)
        return paginator.get_paginated_response(serializer.data)
        
    def post(self, request, *args, **kwargs):
        data = request.data
        data["enterprise"] = request.user.employee.enterprise.id
        data["employee"] = request.user.employee.id
        
        serializer = PurchaseTransactionSerializer(data=data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class PurchaseTransactionChangeView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PurchaseTransaction.objects.all()
    serializer_class = PurchaseTransactionSerializer

    def update(self, request, *args, **kwargs):
        role = request.user.employee.role
        if role != "Admin":
            return Response("Unauthorized")
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Ensure that we're using partial update
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

    def perform_update(self, serializer):
        serializer.save()


    def delete(self,request,pk,format=None):
        with transaction.atomic():
            role = request.user.employee.role
            if role != "Admin":
                return Response("Unauthorized")
            purchase_transaction = PurchaseTransaction.objects.get(id=pk)
            purchases = purchase_transaction.purchase.all()
            returned_amount = 0
            for purchase in purchases:
                if not purchase.returned:
                    product = purchase.phone
                    product.count = product.count - 1 if product.count is not None else -1
                    product.stock = product.stock - product.selling_price if product.stock is not None else -product.selling_price
                    product.save()
                    brand = product.brand
                    brand.count = brand.count - 1 if brand.count is not None else -1
                    brand.stock = brand.stock - purchase.phone.selling_price if brand.stock is not None else -purchase.phone.selling_price
                    brand.save()
                else:
                    returned_amount += purchase.unit_price

            vts = VendorTransaction.objects.filter(purchase_transaction=purchase_transaction)
            if vts:
                for vt in vts:
                    vt.delete()
            purchase_transaction.delete()   
            return Response("Deleted")  
 
    

class SalesTransactionChangeView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SalesTransaction.objects.all()
    serializer_class = SalesTransactionSerializer

    def update(self, request, *args, **kwargs):
        role = request.user.employee.role
        if role != "Admin":
            return Response("Unauthorized")
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Ensure that we're using partial update
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

    def perform_update(self, serializer):
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        role = request.user.employee.role
        if role != "Admin":
            return Response("Unauthorized")
        instance = self.get_object()
        scheme = None
        sales_data = instance.sales.all()
        phones = []
        for sale in sales_data:
            #print("theakhdnsaknd ",sale)
            scheme = Scheme.objects.filter(sales=sale).first()
            pp = PriceProtection.objects.filter(sales=sale).first()
            phones.append(sale.phone) if sale.phone not in phones else None
            #print(scheme)
            imei = sale.imei_number

            item = Item.objects.create(imei_number = imei, phone = sale.phone)
            
            brand = sale.phone.brand
            purchase = Purchase.objects.filter(imei_number = imei, phone = sale.phone).first()
            brand.stock = brand.stock + purchase.unit_price
            brand.save()

            # Item.objects.filter(imei_number = new_imei).delete()

        
        # Perform the deletion
        self.perform_destroy(instance)
        for phone in phones:
            phone.calculate_quantity()
        if scheme:
            scheme.calculate_receivable()
        if pp:
            pp.calculate_receivable()
        #print("LASTTTT")
        
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_destroy(self, instance):
        # Any custom logic you want before or after deletion can be added here
        # e.g. logging, sending notifications, updating related records, etc.
        
        instance.delete()
    


class PurchaseView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        enterprise = user.employee.enterprise
        purchases = Purchase.objects.filter(purchase_transaction__enterprise=enterprise)
        serializer = PurchaseSerializer(purchases, many=True)
        return Response(serializer.data)
    

class SalesTransactionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request,pk=None, branch=None):
        user = request.user
        enterprise = user.employee.enterprise
        user = request.user
        enterprise = user.employee.enterprise
        search = request.GET.get('search')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        if pk:
            sales_transaction = get_object_or_404(SalesTransaction, pk=pk)
            serializer = SalesTransactionSerializer(sales_transaction)
            return Response(serializer.data)

        transactions = SalesTransaction.objects.filter(enterprise=enterprise)
        if branch:
            transactions = transactions.filter(branch=branch)

        if search:
            phone_transactions = transactions.filter(sales__phone__name__icontains = search)
            customer_trasactions = transactions.filter(name__icontains = search)
            imei_transactions = transactions.filter(sales__imei_number__icontains = search)
            bill_transactions = transactions.filter(bill_no__icontains = search)
            transactions = phone_transactions.union(customer_trasactions,imei_transactions,bill_transactions)
        
        if start_date and end_date:
            start_date = parse_date(start_date)
            end_date = parse_date(end_date)

        if start_date and end_date:
            start_date = datetime.combine(start_date, datetime.min.time())
            end_date = datetime.combine(end_date, datetime.max.time())
            
            transactions = SalesTransaction.objects.filter(
                date__range=(start_date, end_date)
            )

        transactions = transactions.order_by('-date','-id')


        paginator = PageNumberPagination()
        paginator.page_size = 5  # Set the page size here
        paginated_transactions = paginator.paginate_queryset(transactions, request)

        serializer = SalesTransactionSerializer(paginated_transactions, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    def post(self, request, *args, **kwargs):

        data = request.data
        data["enterprise"] = request.user.employee.enterprise.id
        data["employee"] = request.user.employee.id
        
        serializer = SalesTransactionSerializer(data=data)
        if serializer.is_valid(raise_exception=True):
            print("VALDI")
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, pk):
        role = request.user.employee.role
        if role != "Admin":
            return Response("Unauthorized")
        sales_transaction = get_object_or_404(SalesTransaction, pk=pk)
        serializer = SalesTransactionSerializer(sales_transaction, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @transaction.atomic
    def delete(self, request, pk):
        role = request.user.employee.role
        if role != "Admin":
            return Response("Unauthorized")
        sales_transaction = SalesTransaction.objects.get(id=pk)
        sales_data = sales_transaction.sales.all()
        for sale in sales_data:
            
            schemes = Scheme.objects.filter(sales__id=sale.id)
            if schemes:
                for scheme in schemes:
                    scheme.sales.remove(sale)
                    scheme.calculate_receivable()
            
            pps = PriceProtection.objects.filter(sales__id=sale.id)
            if pps:
                for pp in pps:
                    pp.sales.remove(sale)
                    pp.calculate_receivable()

            imei = sale.imei_number

            item = Item.objects.create(imei_number = imei, phone = sale.phone)

            sale.phone.count = sale.phone.count + 1 if sale.phone.count is not None else 1
            sale.phone.stock = sale.phone.stock + sale.phone.selling_price if sale.phone.stock is not None else sale.phone.selling_price
            sale.phone.save()

            brand = sale.phone.brand
            brand.count = brand.count + 1 if brand.count is not None else 1
            brand.stock = brand.stock + sale.phone.selling_price if brand.stock is not None else sale.phone.selling_price
            brand.save()

        dt = DebtorTransaction.objects.filter(sales_transaction=sales_transaction).first()
        if dt:
            dt.delete()
        sales_transaction.delete()
        return Response("Sales transaction deleted successfully", status=status.HTTP_204_NO_CONTENT)


class SalesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        enterprise = user.employee.enterprise
        sales = Sales.objects.filter(sales_transaction__enterprise=enterprise)
        serializer = SalesSerializer(sales, many=True)
        return Response(serializer.data)

class VendorView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, branch=None):
        user = request.user
        enterprise = user.employee.enterprise
        vendors = Vendor.objects.filter(enterprise=enterprise)
        print("########################",vendors)
        for vendor in vendors:
            print(vendor.branch)
        if branch:
            vendors = vendors.filter(branch=branch)
        print("******************",vendors)
        serializer = VendorSerializer(vendors, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        user = request.user
        enterprise = user.employee.enterprise
        data = request.data
        data["enterprise"] = enterprise.id
        serializer = VendorSerializer(data=data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, id):
        role = request.user.employee.role
        if role != "Admin":
            return Response("Unauthorized")
        vendor = get_object_or_404(Vendor, id=id)
        vendor.delete()
        return Response("Vendor deleted successfully", status=status.HTTP_204_NO_CONTENT)

class SchemeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request,pk=None, branch=None, *args, **kwargs):
        schemes = Scheme.objects.filter(enterprise = request.user.employee.enterprise)
        if pk:
            schemes = schemes.filter(pk=pk).first()
            serializer = SchemeSerializer(schemes)
            return Response(serializer.data)
        
        if branch:
            schemes = schemes.filter(branch=branch)
        serializer = SchemeSerializer(schemes,many=True)
        return Response(serializer.data)
    
    def post(self,request,*args,**kwargs):
        data = request.data 
        data["enterprise"]= request.user.employee.enterprise.id 
        id = data["phone"]
        brand = Phone.objects.get(id=id).brand
        data["brand"] = brand.id
        serializer = SchemeSerializer(data=data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data)
    
    def patch(self,request,pk):
        role = request.user.employee.role
        if role != "Admin":
            return Response("Unauthorized")
        scheme = get_object_or_404(Scheme, pk=pk)
        
        # Pass `partial=True` to allow partial updates
        serializer = SchemeSerializer(scheme, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()  # Save the changes
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        role = request.user.employee.role
        if role != "Admin":
            return Response("Unauthorized")
        scheme = get_object_or_404(Scheme, pk=pk)
        scheme.delete()
        return Response("Scheme deleted successfully", status=status.HTTP_204_NO_CONTENT)

class SchemePhoneView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request,id):
        user = request.user
        enterprise = user.employee.enterprise
        search = request.GET.get('search')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        schemes = Scheme.objects.filter(enterprise=enterprise,brand=id)

        if search:
            schemes_phone = schemes.filter(phone__name__icontains = search)
            schemes_imei = schemes.filter(sales__imei_number__icontains = search)
            schemes = schemes_phone.union(schemes_imei)
        
        if start_date and end_date:
            start_date = parse_date(start_date)
            end_date = parse_date(end_date)

        if start_date and end_date:
            start_date = datetime.combine(start_date, datetime.min.time())
            end_date = datetime.combine(end_date, datetime.max.time())
            
            schemes = Scheme.objects.filter(
                from_date__range=(start_date, end_date)
            )
        
        schemes = schemes.order_by('-from_date')


        # paginator = PageNumberPagination()
        # paginator.page_size = 2  # Set the page size here
        # paginated_transactions = paginator.paginate_queryset(transactions, request)

        serializer = SchemeSerializer(schemes, many=True)
        # return paginator.get_paginated_response(serializer.data)
        return Response(serializer.data)


        

class PriceProtectionView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self,request,*args, **kwargs):
        pps = PriceProtection.objects.filter(enterprise = request.user.employee.enterprise)
        serializer = PriceProtectionSerializer(pps,many=True)
        return Response(serializer.data)
    
    
    def patch(self,request,pk):
        role = request.user.employee.role
        if role != "Admin":
            return Response("Unauthorized")
        
        pps = get_object_or_404(PriceProtection, pk=pk)
        #print(pps)
        
        # Pass `partial=True` to allow partial updates
        serializer = PriceProtectionSerializer(pps, data=request.data, partial=True)

        
        if serializer.is_valid():
            serializer.save()  # Save the changes
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    
    def post(self,request,*args, **kwargs):
        data = request.data
        data["enterprise"] = request.user.employee.enterprise.id 
        id = data["phone"]
        brand = Phone.objects.get(id=id).brand
        data["brand"] = brand.id
        serializer = PriceProtectionSerializer(data=data)
        if serializer.is_valid(raise_exception = True):
            serializer.save()
            return Response(serializer.data)
        

class StatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get raw query params
        start_date_str = request.GET.get('start_date')
        end_date_str   = request.GET.get('end_date')

        # If either is missing, default to first of this month through today
        if not start_date_str or not end_date_str:
            today = timezone.now().date()                   # <— now a date
            start_date = today.replace(day=1)               # <— first day of month
            end_date = today
        else:
            # parse_date returns a date object
            start_date = parse_date(start_date_str)
            end_date   = parse_date(end_date_str)

        enterprise = request.user.employee.enterprise

        allstock  = Item.objects.filter(
            phone__brand__enterprise=enterprise
        ).count()
        allbrands = Brand.objects.filter(
            enterprise=enterprise
        ).count()

        # NOW we filter directly on the DateField, not __date
        monthlypurchases = Purchase.objects.filter(
            purchase_transaction__enterprise=enterprise,
            purchase_transaction__date__range=(start_date, end_date)
        )
        monthlysales = Sales.objects.filter(
            sales_transaction__enterprise=enterprise,
            sales_transaction__date__range=(start_date, end_date)
        )

        # For daily, compare the DateField to today
        today = timezone.now().date()
        dailypurchases = Purchase.objects.filter(
            purchase_transaction__enterprise=enterprise,
            purchase_transaction__date=today
        )
        dailysales = Sales.objects.filter(
            sales_transaction__enterprise=enterprise,
            sales_transaction__date=today
        )

        # Sum up transaction amounts over the same date ranges
        ptamt = 0
        for pt in PurchaseTransaction.objects.filter(
            enterprise=enterprise,
            date__range=(start_date, end_date)
        ):
            if pt.total_amount:
                ptamt += pt.total_amount

        dailyptamt = 0
        for pt in PurchaseTransaction.objects.filter(
            enterprise=enterprise,
            date=today
        ):
            if pt.total_amount:
                dailyptamt += pt.total_amount

        stamt = 0
        for st in SalesTransaction.objects.filter(
            enterprise=enterprise,
            date__range=(start_date, end_date)
        ):
            if st.total_amount:
                stamt += st.total_amount

        dailystamt = 0
        for st in SalesTransaction.objects.filter(
            enterprise=enterprise,
            date=today
        ):
            if st.total_amount:
                dailystamt += st.total_amount

        # Profit calculations unchanged
        daily_profit = 0
        for sale in dailysales:
            purchase = Purchase.objects.filter(
                imei_number=sale.imei_number
            ).first()
            if purchase:
                daily_profit += sale.unit_price - purchase.unit_price

        monthly_profit = 0
        for sale in monthlysales:
            purchase = Purchase.objects.filter(
                imei_number=sale.imei_number
            ).first()
            if purchase:
                monthly_profit += sale.unit_price - purchase.unit_price

        stat = {
            "enterprise": enterprise.name,
            "daily": {
                "purchases": dailypurchases.count(),
                "dailyptamt": dailyptamt,
                "sales": dailysales.count(),
                "dailystamt": dailystamt,
                "profit": round(daily_profit, 2)
            },
            "monthly": {
                "purchases": monthlypurchases.count(),
                "ptamt": ptamt,
                "stamt": stamt,
                "sales": monthlysales.count(),
                "profit": round(monthly_profit, 2)
            },
            "stock": allstock,
            "brands": allbrands
        }
        return Response(stat)
    
class SchemeBrandView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, branch=None):
        user = request.user
        enterprise = user.employee.enterprise

        # Get all brands with schemes under the user's enterprise
        brands_with_schemes = Brand.objects.filter(enterprise=enterprise, branch=branch, scheme_brand__isnull=False).distinct()

        active_result = []
        expired_result = []

        # Loop through each brand
        for brand in brands_with_schemes:
            # Filter active schemes
            active_schemes = Scheme.objects.filter(
                enterprise=enterprise, 
                brand=brand, 
                status = "active"  # Schemes with to_date in the future
            )
            # Filter expired schemes
            expired_schemes = Scheme.objects.filter(
                enterprise=enterprise, 
                brand=brand, 
                status="expired"  # Schemes with to_date in the past
            )

            # Calculate total receivables for active schemes
            active_count = active_schemes.count()
            active_receivables = active_schemes.aggregate(total_receivable=models.Sum('receivable'))['total_receivable'] or 0

            # Calculate total receivables for expired schemes
            expired_count = expired_schemes.count()
            expired_receivables = expired_schemes.aggregate(total_receivable=models.Sum('receivable'))['total_receivable'] or 0

            # Add to active list if there are active schemes
            if active_count > 0:
                active_result.append({
                    "id": brand.id,
                    "brand": brand.name,
                    "count": active_count,
                    "total_receivables": active_receivables
                })

            # Add to expired list if there are expired schemes
            if expired_count > 0:
                expired_result.append({
                    "id": brand.id,
                    "brand": brand.name,
                    "count": expired_count,
                    "total_receivables": expired_receivables
                })

        # Return both active and expired lists
        return Response({
            "active_schemes": active_result,
            "expired_schemes": expired_result
        })
    
class SingleScheme(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request,id):
        scheme = Scheme.objects.filter(id=id).first()
        sales = scheme.sales.all().order_by('-sales_transaction__date')
        list = []
        if sales:
            for sale in sales:
                list.append(sale.imei_number)
        dict = {
            "phone":scheme.phone.id,
            "phone_name":scheme.phone.name,
            "list":list,
            "receivables":scheme.receivable,
            "status":scheme.status
        }
        return Response(dict)

# class SchemeChangeView(generics.RetrieveUpdateDestroyAPIView):
#     queryset = Scheme.objects.all()
#     serializer_class = SchemeSerializer

#     def update(self, request, *args, **kwargs):
#         role = request.user.employee.role
#         if role != "Admin":
#             return Response("Unauthorized")
#         partial = kwargs.pop('partial', False)
#         instance = self.get_object()
        
#         # Ensure that we're using partial update
#         serializer = self.get_serializer(instance, data=request.data, partial=True)
#         serializer.is_valid(raise_exception=True)
        
#         self.perform_update(serializer)

#         if getattr(instance, '_prefetched_objects_cache', None):
#             # If 'prefetch_related' has been applied to a queryset, we need to
#             # forcibly invalidate the prefetch cache on the instance.
#             instance._prefetched_objects_cache = {}

#         return Response(serializer.data)

#     def perform_update(self, serializer):
#         serializer.save()


class PriceProtectionChangeView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PriceProtection.objects.all()
    serializer_class = PriceProtectionSerializer

    def update(self, request, *args, **kwargs):
        role = request.user.employee.role
        if role != "Admin":
            return Response("Unauthorized")
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Ensure that we're using partial update
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

    def perform_update(self, serializer):
        serializer.save()

class PPBrandView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request,branch=None):
        user = request.user
        enterprise = user.employee.enterprise

        # Get all brands with schemes under the user's enterprise
        brands_with_pp = Brand.objects.filter(enterprise=enterprise, pp_brand__isnull=False).distinct()
        brands_with_pp = brands_with_pp.filter(branch=branch) if branch else brands_with_pp

        active_result = []
        expired_result = []

        # Loop through each brand
        for brand in brands_with_pp:
            # Filter active schemes
            active_pps = PriceProtection.objects.filter(
                enterprise=enterprise, 
                brand=brand, 
                status = "active"  # Schemes with to_date in the future
            )
            # Filter expired schemes
            expired_pps = PriceProtection.objects.filter(
                enterprise=enterprise, 
                brand=brand, 
                status="expired"  # Schemes with to_date in the past
            )

            # Calculate total receivables for active schemes
            active_count = active_pps.count()
            active_receivables = active_pps.aggregate(total_receivable=models.Sum('receivable'))['total_receivable'] or 0

            # Calculate total receivables for expired schemes
            expired_count = expired_pps.count()
            expired_receivables = expired_pps.aggregate(total_receivable=models.Sum('receivable'))['total_receivable'] or 0

            # Add to active list if there are active schemes
            if active_count > 0:
                active_result.append({
                    "id": brand.id,
                    "brand": brand.name,
                    "count": active_count,
                    "total_receivables": active_receivables
                })

            # Add to expired list if there are expired schemes
            if expired_count > 0:
                expired_result.append({
                    "id": brand.id,
                    "brand": brand.name,
                    "count": expired_count,
                    "total_receivables": expired_receivables
                })

        # Return both active and expired lists
        return Response({
            "active_pps": active_result,
            "expired_pps": expired_result
        })
    
class SinglePP(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request,id):
        pp = PriceProtection.objects.filter(id=id).first()
        sales = pp.sales.all().order_by('-sales_transaction__date')
        list = []
        if sales:
            for sale in sales:
                list.append(sale.imei_number)
        dict = {
            "phone":pp.phone.name,
            "list":list,
            "receivables":pp.receivable,
            "status":pp.status
        }
        return Response(dict)
    


class PPPhoneView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request,id):
        user = request.user
        enterprise = user.employee.enterprise
        search = request.GET.get('search')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        pps = PriceProtection.objects.filter(enterprise=enterprise,brand=id)

        if search:
            pps_phone = pps.filter(phone__name__icontains = search)
            pps_imei = pps.filter(sales__imei_number__icontains = search)
            pps = pps_phone.union(pps_imei)
        
        if start_date and end_date:
            start_date = parse_date(start_date)
            end_date = parse_date(end_date)

        if start_date and end_date:
            start_date = datetime.combine(start_date, datetime.min.time())
            end_date = datetime.combine(end_date, datetime.max.time())
            
            pps = PriceProtection.objects.filter(
                from_date__range=(start_date, end_date)
            )
        
        pps = pps.order_by('-from_date')


        # paginator = PageNumberPagination()
        # paginator.page_size = 2  # Set the page size here
        # paginated_transactions = paginator.paginate_queryset(transactions, request)

        serializer = PriceProtectionSerializer(pps, many=True)
        # return paginator.get_paginated_response(serializer.data)
        return Response(serializer.data)


class VendorBrandsView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request,branch=None):
        # id = request.GET.get("id")
        # if id:
        #     brand = Brand.objects.get(id=id)
        #     phones = Phone.objects.filter(brand = brand)
        #     #print(phones)
        #     if phones:
        #         serializer = PhoneSerializer(phones,many=True)
        #         return Response(serializer.data)
        #     else:
        #         return Response("NONE")
        brands = Brand.objects.filter(enterprise = request.user.employee.enterprise)
        if branch:
            brands = brands.filter(branch=branch)
        serializer = VendorBrandSerializer(brands,many=True)


        return Response(serializer.data)

class SingleVendorBrandView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request,id):
        vendors = Vendor.objects.filter(enterprise = request.user.employee.enterprise, brand=id)
        serializer = VendorSerializer(vendors, many=True)
        return Response(serializer.data)


class VendorTransactionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request,branch=None):
        enterprise = request.user.employee.enterprise
        search = request.GET.get('search')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        transactions = VendorTransaction.objects.filter(enterprise=enterprise)
        if branch:
            transactions = transactions.filter(branch=branch)

        if search:
            name = transactions.filter(vendor__name__icontains = search)
            amount = transactions.filter(amount__icontains = search)
            transactions = name.union(amount)
        
        if start_date and end_date:
            start_date = parse_date(start_date)
            end_date = parse_date(end_date) 
            transactions = VendorTransaction.objects.filter(
                    date__range=(start_date, end_date)
                )

        transactions = transactions.order_by('-date','-id')

        print(transactions)

        paginator = PageNumberPagination()
        paginator.page_size = 5  # Set the page size here
        paginated_transactions = paginator.paginate_queryset(transactions, request)

        serializer = VendorTransactionSerializer(paginated_transactions, many=True)
        return paginator.get_paginated_response(serializer.data)
 
    def post(self,request):
        data = request.data
        user = request.user
        enterprise = user.employee.enterprise
        data["enterprise"] = enterprise.id
        
        serializer = VendorTransactionSerializer(data=data)
        if serializer.is_valid(raise_exception = True):
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self,request,pk):
        role = request.user.employee.role
        if role != "Admin":
            return Response("Unauthorized")
        data = request.data
        transaction = VendorTransaction.objects.filter(id=pk).first()
        #print(transaction)
        if transaction:
            serializer = VendorTransactionSerializer(transaction,data=data,partial=True)
            if serializer.is_valid(raise_exception = True):
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    def delete(self,request,pk):
        role = request.user.employee.role
        if role != "Admin":
            return Response("Unauthorized")
        transaction = VendorTransaction.objects.filter(id=pk).first()
        if transaction:  
            transaction.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(status=status.HTTP_404_NOT_FOUND)
    

class BarChartView(APIView):
    
    permission_classes = [IsAuthenticated]

    def get(self,request,*args, **kwargs):

        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        if not start_date or not end_date:
            today = timezone.now().date()  # Get today's date
            start_date = today.replace(day=1)  # First day of the current month
            end_date = today
        
        start_date = parse_date(start_date) if isinstance(start_date, str) else start_date
        end_date = parse_date(end_date) if isinstance(end_date, str) else end_date

        enterprise = request.user.employee.enterprise
        sales = Sales.objects.filter(sales_transaction__enterprise = enterprise,sales_transaction__date__range=(start_date, end_date))
        print(sales)
        brands = Brand.objects.filter(enterprise = enterprise)
        count_list = []
        for brand in brands:
            sales_count = sales.filter(phone__brand = brand).count()
            count_list.append({'Brand':brand.name,'Sales':sales_count})
        
        res = {"count":count_list}
        amount_list = []
        for brand in brands:
            sales_amount = sales.filter(phone__brand = brand).aggregate(total=models.Sum('unit_price'))['total'] or 0
            amount_list.append({'Brand':brand.name,'Sales':sales_amount})
        res["amount"] = amount_list

        profit_list = []
        for brand in brands:
            profit_sales = sales.filter(phone__brand = brand)
            profit = 0
            for sale in profit_sales:
                purchase = Purchase.objects.filter(imei_number = sale.imei_number).first()
                if purchase:
                    profit += sale.unit_price - purchase.unit_price
            profit_list.append({'Brand':brand.name,'Sales':round(profit,2)})
        res["profit"] = profit_list


        return Response(res)

# class LineGraphView(APIView):

#     permission_classes = [IsAuthenticated]

#     def get(self,request,*args, **kwargs):
        
#         today = timezone.now()
#         today = today - timezone.timedelta(days=3)
#         start_date = today - timezone.timedelta(days=7)
        
        
#         print(today)
#         print(start_date)
#         enterprise = request.user.employee.enterprise

#         sales = (
#             Sales.objects.filter(sales_transaction__enterprise=enterprise, sales_transaction__date__date__range=[start_date, today])
#             .values('sales_transaction__date__date')
#             .annotate(total_sales=Sum('unit_price'))
#         )

#         sales_by_day = {
#             (today - timezone.timedelta(days=i)).strftime('%A'): 0 for i in range(6, -1, -1)
#         }
#         for sale in sales:
#             day_name = sale['sales_transaction__date__date'].strftime('%A')
#             sales_by_day[day_name] = sale['total_sales']
#         return Response(sales_by_day)
    
# # const chartData = [
# #   { month: "January", desktop: 186 },
# #   { month: "February", desktop: 305 },
# #   { month: "March", desktop: 237 },
# #   { month: "April", desktop: 73 },
# #   { month: "May", desktop: 209 },
# #   { month: "June", desktop: 214 },
# #   { month: "June", desktop: 214 },

# # ]

        # sales = Sales.objects.filter(sales_transaction__enterprise = request.user.employee.enterprise).annotate(total_sales=Sum('unit_price'))
        # print(sales)
        # return Response("sales")

        from django.db.models import Sum
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class LineGraphView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Step 1: Import necessary modules
        from django.db.models import Sum
        from django.utils import timezone

        # Step 2: Calculate the date range for the last 7 days
        today = timezone.now().date()
        start_date = today - timezone.timedelta(days=6)  # Include today and the previous 6 days

        # Step 3: Get the enterprise associated with the current user
        enterprise = request.user.employee.enterprise

        # Step 4: Query to get total sales per day in the date range
        sales = (
            Sales.objects.filter(
                sales_transaction__enterprise=enterprise,
                sales_transaction__date__range=[start_date, today]
            )
            .values('sales_transaction__date')
            .annotate(total_sales=Sum('unit_price'))
        )

        # Step 5: Initialize a list of dictionaries for the last 7 days
        sales_by_day = [
            {'day': (today - timezone.timedelta(days=i)).strftime('%A'), 'count': 0}
            for i in range(6, -1, -1)
        ]

        # Step 6: Create a mapping from day name to index in the list
        day_name_to_index = {entry['day']: idx for idx, entry in enumerate(sales_by_day)}

        # Step 7: Update the list with actual sales data
        for sale in sales:
            sale_date = sale['sales_transaction__date']
            day_name = sale_date.strftime('%A')
            total_sales = sale['total_sales']

            # Find the index in the list for this day and update the count
            idx = day_name_to_index.get(day_name)
            if idx is not None:
                sales_by_day[idx]['count'] = total_sales

        # Step 8: Return the response with the sales by day
        return Response(sales_by_day)


class PurchaseReturnView(APIView):

    permission_classes = [IsAuthenticated]


    def get(self, request, branch=None):
        enterprise = request.user.employee.enterprise
        search = request.GET.get('search')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        # Base QuerySet
        purchase_returns = PurchaseReturn.objects.filter(enterprise=enterprise)
        print("returns",purchase_returns)
        for p in purchase_returns:
            print(p.branch)
        if branch:
            purchase_returns = purchase_returns.filter(branch=branch)
        print("branch returns",purchase_returns)
        # -----------------
        # 1) Search Filter
        # -----------------
        if search:
            name_filter = purchase_returns.filter(purchase_transaction__vendor__name__icontains=search)
            # amount_filter = purchase_returns.filter(amount__icontains=search)
            phone_name = purchase_returns.filter(purchases__phone__name__icontains=search)
            imei_number = purchase_returns.filter(purchases__imei_number__icontains=search)
            
            # union() will merge the two QuerySets without duplicates.
            purchase_returns = name_filter.union(phone_name,imei_number)
            if search.isdigit():
                id = purchase_returns.filter(id__icontains=search)
                purchase_returns = purchase_returns.union(id)

        # ---------------------
        # 2) Date Range Filter
        # ---------------------
        # Only attempt date range filter if both start and end date are provided
        if start_date and end_date:
            start_date_obj = parse_date(start_date)
            end_date_obj = parse_date(end_date)
            if start_date_obj and end_date_obj:
                # Combine with min and max time to capture full day range
                start_datetime = datetime.combine(start_date_obj, datetime.min.time())
                end_datetime = datetime.combine(end_date_obj, datetime.max.time())

                purchase_returns = purchase_returns.filter(
                    date__range=(start_datetime, end_datetime)
                )

        # ---------------------------------
        # 3) Sort and Paginate the Results
        # ---------------------------------
        purchase_returns = purchase_returns.order_by('-date')  # Sorting

        paginator = PageNumberPagination()
        paginator.page_size = 5  # Set your desired page size
        paginated_data = paginator.paginate_queryset(purchase_returns, request)

        serializer = PurchaseReturnSerializer(paginated_data, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    def post(self,request):
        data = request.data 
        user = request.user
        enterprise = user.employee.enterprise
        data['enterprise'] = enterprise.id 
        if "date" in data:
            date_str = data["date"]
            # Assuming the format is 'YYYY-MM-DD'
            date_object = datetime.strptime(date_str, '%Y-%m-%d').date()
            datetime_with_current_time = datetime.combine(date_object, timezone.now().time())
            data["date"] = datetime_with_current_time.isoformat()
        serializer = PurchaseReturnSerializer(data=data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self,request,pk):
        purchase_return = PurchaseReturn.objects.filter(id=pk).first()
        serializer = PurchaseReturnSerializer()
        serializer.delete(purchase_return)
        return Response(status=status.HTTP_204_NO_CONTENT)
    




class SalesReturnView(APIView):

    permission_classes = [IsAuthenticated]


    def get(self, request, branch=None):
        enterprise = request.user.employee.enterprise
        search = request.GET.get('search')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        # Base QuerySet
        sales_returns = SalesReturn.objects.filter(enterprise=enterprise)
        
        if branch:
            sales_returns = sales_returns.filter(branch=branch)
        # -----------------
        # 1) Search Filter
        # -----------------
        if search:
            name_filter = sales_returns.filter(sales_transaction__customer_name__icontains=search)
            # amount_filter = sales_returns.filter(amount__icontains=search)
            phone_name = sales_returns.filter(sales_transaction__phone__name__icontains=search)
            imei_number = sales_returns.filter(sales_transaction__imei_number__icontains=search)

            # union() will merge the two QuerySets without duplicates.
            sales_returns = name_filter.union(phone_name,imei_number)
            if search.isdigit():
                id = sales_returns.filter(id__icontains=search)
                sales_returns = sales_returns.union(id)

        # ---------------------
        # 2) Date Range Filter
        # ---------------------
        # Only attempt date range filter if both start and end date are provided
        if start_date and end_date:
            start_date = parse_date(start_date)
            end_date = parse_date(end_date)

            sales_returns = sales_returns.filter(
                date__range=(start_date, end_date)
            )

        # ---------------------------------
        # 3) Sort and Paginate the Results
        # ---------------------------------
        sales_returns = sales_returns.order_by('-date')  # Sorting

        paginator = PageNumberPagination()
        paginator.page_size = 5  # Set your desired page size
        paginated_data = paginator.paginate_queryset(sales_returns, request)

        serializer = SalesReturnSerializer(paginated_data, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    def post(self,request):
        data = request.data 
        user = request.user
        enterprise = user.employee.enterprise
        data['enterprise'] = enterprise.id 
        serializer = SalesReturnSerializer(data=data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self,request,pk):
        sales_return = SalesReturn.objects.filter(id=pk).first()
        serializer = SalesReturnSerializer()
        serializer.delete(sales_return)
        return Response(status=status.HTTP_204_NO_CONTENT)
    


class SalesReportView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self,request,branch=None):
        
        search = request.GET.get('search')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        phone = request.GET.get('phone')

        sales = Sales.objects.filter(sales_transaction__enterprise = request.user.employee.enterprise,returned = False)
        if branch:
            sales = sales.filter(sales_transaction__branch = branch)
        if search:
            # first_date_of_month = timezone.now().date().replace(day=1)
            # today = timezone.now().date()
            sales = sales.filter(phone__brand__name__icontains = search)
            # sales = sales.filter(sales_transaction__date__range=(first_date_of_month,today))

        if phone:
            sales = sales.filter(phone__name__startswith = phone)

        if start_date and end_date:
            start_date = parse_date(start_date)
            end_date = parse_date(end_date)
            sales = sales.filter(sales_transaction__date__range=(start_date, end_date))
        elif start_date and not end_date:
            start_date = parse_date(start_date)
            sales = sales.filter(sales_transaction__date__gte=start_date)
        elif end_date and not start_date:
            end_date = parse_date(end_date)
            sales = sales.filter(sales_transaction__date__lte=end_date)

        
        if not search and not start_date and not end_date:
            sales = sales.filter(sales_transaction__date = timezone.now().date())

        count = sales.count()

        total_profit = 0
        total_sales = 0
        total_discount = 0
        cash_sales = 0
        sales_transaction = []
        cash_transaction = []
        list = []
        for sale in sales:
            purchase = Purchase.objects.filter(imei_number = sale.imei_number).first()
            if purchase:
                profit = sale.unit_price - purchase.unit_price
                total_profit += profit
            else:
                profit = 0
            total_sales += sale.unit_price
            list.append({
                "date": sale.sales_transaction.date.strftime('%Y-%m-%d'),
                "brand": sale.phone.brand.name,
                "phone": sale.phone.name,
                "imei_number": sale.imei_number,
                "unit_price": sale.unit_price,
                "profit": profit,
                "method": sale.sales_transaction.method
            })
            if sale.sales_transaction.id not in sales_transaction:
                total_discount += sale.sales_transaction.discount
                sales_transaction.append(sale.sales_transaction.id)
            #add up the total cash transactions minus the discount on those transactions
            if sale.sales_transaction.method == "cash" and sale.sales_transaction.id not in cash_transaction:
                cash_transaction.append(sale.sales_transaction.id)
                cash_sales += sale.unit_price - sale.sales_transaction.discount
        
        list.append({
            "total_profit": total_profit,
            "count": count,
            "subtotal_sales": total_sales,
            "total_discount": total_discount,
            "total_sales": total_sales - total_discount,
            "cash_sales": cash_sales
        })
        return Response(list)


class PurchaseReportView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, branch=None):
        search = request.GET.get('search')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        phone = request.GET.get('phone')

        purchases = Purchase.objects.filter(purchase_transaction__enterprise=request.user.employee.enterprise, returned=False)
        if branch:
            purchases = purchases.filter(purchase_transaction__branch=branch)

        if search:
            purchases = purchases.filter(phone__brand__name__icontains=search)

        if phone:
            purchases = purchases.filter(phone__name__startswith=phone)

        if start_date and end_date:
            start_date = parse_date(start_date)
            end_date = parse_date(end_date)
            purchases = purchases.filter(purchase_transaction__date__range=(start_date, end_date))
        elif start_date and not end_date:
            start_date = parse_date(start_date)
            purchases = purchases.filter(purchase_transaction__date__gte=start_date)
        elif end_date and not start_date:
            end_date = parse_date(end_date)
            purchases = purchases.filter(purchase_transaction__date__lte=end_date)

        if not search and not start_date and not end_date:
            purchases = purchases.filter(purchase_transaction__date=timezone.now().date())

        count = purchases.count()

        total_purchase = 0
        total_discount = 0
        cash_purchases = 0
        purchase_transactions = []
        cash_transaction_ids = []
        result = []

        for purchase in purchases:
            total_purchase += purchase.unit_price
            result.append({
                "date": purchase.purchase_transaction.date.strftime('%Y-%m-%d'),
                "brand": purchase.phone.brand.name,
                "phone": purchase.phone.name,
                "imei_number": purchase.imei_number,
                "unit_price": purchase.unit_price,
                "method": purchase.purchase_transaction.method,
            })

            if purchase.purchase_transaction.id not in purchase_transactions:
                purchase_transactions.append(purchase.purchase_transaction.id)
                if purchase.purchase_transaction.method == "cash" and purchase.purchase_transaction.id not in cash_transaction_ids:
                    cash_transaction_ids.append(purchase.purchase_transaction.id)
                    cash_purchases += purchase.unit_price

        result.append({
            "total_profit": 0,
            "count": count,
            "subtotal_sales": total_purchase,
            "total_discount": total_discount,
            "total_sales": total_purchase - total_discount,
            "cash_sales": cash_purchases
        })
        return Response(result)
    


class EMIDebtorsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, branchId=None):
        enterprise = request.user.employee.enterprise
        debtors = EMIDebtor.objects.filter(enterprise=enterprise)
        
        if branchId:
            debtors = debtors.filter(branch=branchId)

        serializer = EMIDebtorSerializer(debtors, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        data = request.data
        data['enterprise'] = request.user.employee.enterprise.id
        serializer = EMIDebtorSerializer(data=data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        role = request.user.employee.role
        if role != "Admin":
            return Response("Unauthorized")
        debtor = EMIDebtor.objects.filter(id=pk).first()
        if not debtor:
            return Response("Debtor not found", status=status.HTTP_404_NOT_FOUND)
        debtor.delete()
        return Response("Deleted", status=status.HTTP_204_NO_CONTENT)
    
class EMIDebtorTransactionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, debtor_pk=None, pk=None, branch=None):
        enterprise = request.user.employee.enterprise
        debtor_transactions = EMIDebtorTransaction.objects.filter(enterprise=enterprise)

        query = request.GET.get('search')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        if branch:
            debtor_transactions = debtor_transactions.filter(branch=branch)

        if pk:
            debtor_transactions = EMIDebtorTransaction.objects.filter(id=pk, enterprise=enterprise).first()
            serializer = EMIDebtorTransactionSerializer(debtor_transactions)
            return Response(serializer.data)
        
        if debtor_pk:
            debtor_transactions = debtor_transactions.filter(debtor=debtor_pk)

        if query:
            debtor_transactions = debtor_transactions.filter(
                Q(debtor__name__icontains=query) | Q(debtor__branch__name__icontains=query)
            )

        if start_date and end_date:
            start_date = parse_date(start_date)
            end_date = parse_date(end_date)

        if start_date and end_date:

            debtor_transactions = debtor_transactions.filter(
                date__range=(start_date, end_date)
            )

        debtor_transactions = debtor_transactions.order_by('-date','-id')


        paginator = PageNumberPagination()
        paginator.page_size = 5  # Set your desired page size
        paginated_data = paginator.paginate_queryset(debtor_transactions, request)

        serializer = EMIDebtorTransactionSerializer(paginated_data, many=True)
        return paginator.get_paginated_response(serializer.data)
    
    def post(self, request):
        data = request.data
        data['enterprise'] = request.user.employee.enterprise.id
        serializer = EMIDebtorTransactionSerializer(data=data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request, pk):
        data = request.data
        data['enterprise'] = request.user.employee.enterprise.id
        role = request.user.employee.role
        if role != "Admin":
            return Response("Unauthorized")
        debtor_transaction = EMIDebtorTransaction.objects.get(id=pk)
        serializer = EMIDebtorTransactionSerializer(debtor_transaction, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors)
    
    def delete(self, request, pk):
        role = request.user.employee.role
        if role != "Admin":
            return Response("Unauthorized")
        debtor_transaction = EMIDebtorTransaction.objects.filter(id=pk).first()
        if not debtor_transaction:
            return Response("Debtor Transaction not found", status=status.HTTP_404_NOT_FOUND)
        debtor_transaction.delete()
        return Response("Deleted", status=status.HTTP_204_NO_CONTENT)
    
class EMIDebtorStatementView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, debtorId=None, branch=None):
        enterprise = request.user.employee.enterprise
        debtor = EMIDebtor.objects.filter(id=debtorId, enterprise=enterprise).first()
        transactions = EMIDebtorTransaction.objects.filter(enterprise=enterprise, debtor=debtor)

        if not debtor:
            return Response("EMI Debtor not found", status=status.HTTP_404_NOT_FOUND)

        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        if start_date and end_date:
            start_date = parse_date(start_date)
            end_date = parse_date(end_date)

        if start_date and end_date:
            transactions = transactions.filter(date__range=(start_date, end_date))
        elif start_date and not end_date:
            transactions = transactions.filter(date__gte=start_date)
        elif not start_date and end_date:
            transactions = transactions.filter(date__lte=end_date)

        if branch:
            transactions = transactions.filter(branch=branch)

        transactions = transactions.order_by('id')
        debtor_data = EMIDebtorSerializer(debtor).data
        tx_data = EMIDebtorTransactionSerializer(transactions, many=True).data
        return Response({'debtor_data': debtor_data, 'debtor_transactions': tx_data})



class VendorStatementView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, vendorId=None, branch=None):
        enterprise = request.user.employee.enterprise
        vendor = Vendor.objects.filter(id=vendorId, enterprise=enterprise).first()
        vendor_transactions = VendorTransaction.objects.filter(enterprise=enterprise,vendor=vendor)

        if not vendor:
            return Response("Vendor not found", status=status.HTTP_404_NOT_FOUND)

        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        if start_date and end_date:
            start_date = parse_date(start_date)
            end_date = parse_date(end_date)

    
        if start_date and end_date:
            vendor_transactions = vendor_transactions.filter(
                date__range=(start_date, end_date)
            )
        elif start_date and not end_date:
            vendor_transactions = vendor_transactions.filter(
                date__gte=start_date
            )
        elif not start_date and end_date:
            vendor_transactions = vendor_transactions.filter(
                date__lte=end_date
            )

        vendor_transactions = vendor_transactions.order_by('date','id')
        vendor = VendorSerializer(vendor).data 
        vts = VendorTransactionSerializer(vendor_transactions, many=True).data
        return Response({'vendor_data': vendor, 'vendor_transactions': vts})
