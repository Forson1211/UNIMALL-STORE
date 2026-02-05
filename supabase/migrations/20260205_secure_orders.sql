-- Migration: Secure Order Processing
-- This function handles order creation, item insertion, and inventory updates atomically

CREATE OR REPLACE FUNCTION public.create_order_secure(
  _buyer_id UUID,
  _total_amount DECIMAL,
  _items JSONB,
  _payment_method TEXT,
  _shipping_details JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_order_id UUID;
  item_record RECORD;
BEGIN
  -- 1. Create the main order
  INSERT INTO public.orders (
    buyer_id,
    total_amount,
    status,
    shipping_address,
    payment_status,
    payment_method
  )
  VALUES (
    _buyer_id,
    _total_amount,
    'pending',
    _shipping_details->>'address',
    'pending',
    _payment_method
  )
  RETURNING id INTO new_order_id;

  -- 2. Create order items and update stock
  FOR item_record IN SELECT * FROM jsonb_to_recordset(_items) AS x(id UUID, quantity INT, price DECIMAL, vendor_id UUID)
  LOOP
    -- Insert into order_items
    INSERT INTO public.order_items (
      order_id,
      product_id,
      vendor_id,
      quantity,
      unit_price,
      total_price
    )
    VALUES (
      new_order_id,
      item_record.id,
      item_record.vendor_id,
      item_record.quantity,
      item_record.price,
      item_record.quantity * item_record.price
    );

    -- Update stock
    UPDATE public.products
    SET stock_quantity = stock_quantity - item_record.quantity
    WHERE id = item_record.id;
  END LOOP;

  -- 3. Create transaction record
  INSERT INTO public.transactions (
    user_id,
    amount,
    type,
    status,
    payment_method,
    reference_id
  )
  VALUES (
    _buyer_id,
    _total_amount,
    'payment',
    'pending',
    _payment_method,
    new_order_id
  );

  RETURN new_order_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_order_secure TO authenticated;
