# Tax Configuration Master Data Seed

This file contains the master data seed for all tax configurations in the system.

## Tax Configuration Structure

### Restaurant GST
- **Tax Rate**: 5%
- **Tax Type**: GST
- **Target**: Full-service restaurants
- **Features**: Standard GST for restaurant services

### Cafe GST
- **Tax Rate**: 5%
- **Tax Type**: GST
- **Target**: Cafes and coffee shops
- **Features**: Tax-inclusive pricing for simpler customer experience

### Bar GST
- **Tax Rate**: 18%
- **Tax Type**: GST
- **Target**: Bars and pubs
- **Features**: Higher GST rate for alcoholic beverages

### Hotel GST
- **Tax Rate**: 18%
- **Tax Type**: GST
- **Target**: Hotels and hospitality businesses
- **Features**: Higher GST rate for luxury services

### Food Truck GST
- **Tax Rate**: 5%
- **Tax Type**: GST
- **Target**: Mobile food businesses
- **Features**: Standard GST for food services

### Tax Exempt Configuration
- **Tax Rate**: 0%
- **Tax Type**: GST
- **Target**: Tax-exempt establishments
- **Features**: No tax applied to orders

## Usage

### Run the tax configuration seed:
```bash
npm run prisma:seed:tax
```

### Or using pnpm:
```bash
pnpm prisma:seed:tax
```

## Notes

- This seed file will **delete all existing tax configurations** and recreate them to ensure consistency
- Each tax configuration is associated with a specific organization type
- Tax rates are stored as decimal values in the database
- The system supports tax-inclusive pricing (where menu prices already include tax)
- The system supports tax-exempt establishments
- Different tax rates can be applied based on service type (dine-in, takeaway, delivery)