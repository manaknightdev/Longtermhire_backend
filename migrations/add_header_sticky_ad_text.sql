-- Add independent header and sticky note ad text columns
ALTER TABLE longtermhire_company 
ADD COLUMN header_ad_text TEXT DEFAULT NULL,
ADD COLUMN sticky_ad_text TEXT DEFAULT NULL;

-- Migrate existing data based on ad_text_destination
-- If ad_text_destination = 'To Header', move ad_text to header_ad_text
UPDATE longtermhire_company 
SET header_ad_text = ad_text 
WHERE ad_text_destination = 'To Header' AND ad_text IS NOT NULL AND ad_text != '';

-- If ad_text_destination = 'To Sticky Note', move ad_text to sticky_ad_text
UPDATE longtermhire_company 
SET sticky_ad_text = ad_text 
WHERE ad_text_destination = 'To Sticky Note' AND ad_text IS NOT NULL AND ad_text != '';
