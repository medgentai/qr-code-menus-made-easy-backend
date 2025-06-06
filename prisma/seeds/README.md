# Plans Master Data Seed

This file contains the master data seed for all subscription plans in the system.

## Pricing Structure

### Restaurant Plan
- **Monthly**: ₹799.00
- **Annual**: ₹7,188.00 (₹599/month when paid annually)
- **Target**: Full-service restaurants
- **Features**: Complete restaurant management with advanced features

### Cafe Plan
- **Monthly**: ₹799.00
- **Annual**: ₹7,188.00 (₹599/month when paid annually)
- **Target**: Cafes and coffee shops
- **Features**: Essential management features for smaller operations

### Bar Plan
- **Monthly**: ₹799.00
- **Annual**: ₹7,188.00 (₹599/month when paid annually)
- **Target**: Bars and pubs
- **Features**: Beverage-focused management with table reservations

### Hotel Plan
- **Monthly**: ₹1,699.00
- **Annual**: ₹17,988.00 (₹1,499/month when paid annually)
- **Target**: Hotels and hospitality businesses
- **Features**: Enterprise-level features including room service and guest management

### Food Truck Plan
- **Monthly**: ₹399.00
- **Annual**: ₹3,588.00 (₹299/month when paid annually)
- **Target**: Mobile food businesses
- **Features**: Mobile-optimized features with location tracking

## Usage

### Run the master plans seed:
```bash
npm run prisma:seed:plans
```

### Or using pnpm:
```bash
pnpm prisma:seed:plans
```

## Notes

- This seed file will **delete all existing plans** and recreate them to ensure consistency
- Each plan is associated with a specific organization type
- Features are stored as string arrays for easy display and modification
- Prices are stored as decimal values in the database
