
-- auxiliary function used to throw an exception when arguments are missing
-- NOTE: this function is also defined in the sql scripts of the api code
CREATE OR REPLACE FUNCTION  raise_exception_invalid_or_missing_args(function_name text, arg_name text)
RETURNS void 
AS $fn$

BEGIN

RAISE EXCEPTION USING 
    ERRCODE = 'plpgsql_error',
    MESSAGE = format('function %s was called with missing or invalid arguments (%s)', function_name, arg_name);

END;

$fn$
LANGUAGE plpgsql;



-- auxiliary function used to throw an exception when the row doesn't exist
CREATE OR REPLACE FUNCTION  raise_exception_no_data_found(table_name text, pk_value text)
RETURNS void 
AS $fn$

BEGIN

RAISE EXCEPTION USING 
    ERRCODE = 'no_data_found',
    MESSAGE = format('row with id %s does not exist in table %s', pk_value, table_name),
    TABLE = table_name;
END;

$fn$
LANGUAGE plpgsql;


