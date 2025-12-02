-- PostgreSQL function for efficient admin dashboard statistics
-- Aggregates order data at database level instead of client-side

CREATE OR REPLACE FUNCTION get_order_stats()
RETURNS TABLE (
  total_orders BIGINT,
  pending_orders BIGINT,
  processing_orders BIGINT,
  shipped_orders BIGINT,
  completed_orders BIGINT,
  cancelled_orders BIGINT,
  total_revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'processing')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'shipped')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT,
    COUNT(*) FILTER (WHERE status = 'cancelled')::BIGINT,
    COALESCE(SUM(total_price) FILTER (WHERE status = 'completed'), 0)::NUMERIC
  FROM orders;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission to authenticated users (admins)
GRANT EXECUTE ON FUNCTION get_order_stats() TO authenticated;

COMMENT ON FUNCTION get_order_stats() IS 'Returns aggregated order statistics for admin dashboard. More efficient than fetching all orders and aggregating client-side.';
