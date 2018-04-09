

CREATE OR REPLACE FUNCTION get_random_string(length INT DEFAULT 4)
RETURNS TEXT AS
$BODY$
BEGIN

    RETURN left(left(md5(random()::text), 5), length);

END;
$BODY$
LANGUAGE plpgsql;

-- select get_random_string(5);