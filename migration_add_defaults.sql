ALTER TABLE longtermhire_company_settings
ADD COLUMN default_quote_expires_after INT DEFAULT 7,
ADD COLUMN default_produce_quote_for INT DEFAULT 12,
ADD COLUMN default_gst_percentage DECIMAL(5, 2) DEFAULT 15.00,
ADD COLUMN default_terms_of_hire TEXT;
