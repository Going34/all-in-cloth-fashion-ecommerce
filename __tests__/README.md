# Payment System Test Suite

This directory contains comprehensive test cases for the Razorpay payment integration.

## Test Structure

### Unit Tests

1. **`services/razorpayService.test.ts`**
   - Tests for Razorpay service functions
   - Order creation, payment verification, signature validation
   - Error handling and edge cases

2. **`modules/payment/payment.service.test.ts`**
   - Tests for payment service business logic
   - Payment order creation, verification flow
   - Order status updates

### API Tests

3. **`api/payments/create.test.ts`**
   - Tests for payment creation API endpoint
   - Authentication, authorization, validation

4. **`api/payments/verify.test.ts`**
   - Tests for payment verification API endpoint
   - Signature validation, status updates

5. **`api/webhooks/razorpay.test.ts`**
   - Tests for Razorpay webhook handler
   - Event processing (payment.captured, payment.failed, order.paid)
   - Signature verification

### Integration Tests

6. **`integration/payment-flow.test.ts`**
   - End-to-end payment flow tests
   - Order creation → Payment → Verification
   - Failure scenarios and edge cases

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run only payment-related tests
npm run test:payment

# Run tests with coverage
npm run test:coverage
```

## Test Coverage

The test suite covers:

- ✅ Razorpay service initialization and configuration
- ✅ Payment order creation
- ✅ Payment signature verification
- ✅ Payment status updates
- ✅ Order status transitions
- ✅ Webhook event handling
- ✅ Error handling and edge cases
- ✅ Authentication and authorization
- ✅ Complete payment flow integration

## Mocking

Tests use Jest mocks for:
- Razorpay SDK
- Database operations
- Authentication
- External services

## Environment Variables

Tests use mock environment variables defined in `jest.setup.js`:
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

## Writing New Tests

When adding new payment features:

1. Add unit tests for service functions
2. Add API tests for new endpoints
3. Add integration tests for new flows
4. Update this README with new test files

## Test Data

Test data follows these patterns:
- Order IDs: `order-123`
- Payment IDs: `payment-123`
- Razorpay Order IDs: `rzp_order_123`
- Razorpay Payment IDs: `rzp_pay_123`
- User IDs: `user-123`



