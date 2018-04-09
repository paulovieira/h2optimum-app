CREATE OR REPLACE FUNCTION delete_installations(data jsonb)
RETURNS SETOF t_installations 
AS $fn$

DECLARE
row_to_delete t_installations%rowtype;

BEGIN

row_to_delete := jsonb_populate_record(null::t_installations, data);

delete from t_installations
where id = row_to_delete.id
returning * 
into strict row_to_delete;

return next row_to_delete;
return;

END;
$fn$
LANGUAGE plpgsql;


/*


select * from delete_installations('{ 
    "id": 5
}');


-- if there is no record with the given id, an error is thrown

select * from delete_installations('{ 
    "id": 9999999
}');

*/
