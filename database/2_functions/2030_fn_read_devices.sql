CREATE OR REPLACE FUNCTION read_devices(options jsonb)
RETURNS SETOF t_devices 
AS $fn$

DECLARE

-- variables for input query options
_user_id int;
_installation_id int;


BEGIN

_user_id := COALESCE((options->>'userId')::int);
_installation_id := COALESCE((options->>'installationId')::int);


if _user_id is null then
  PERFORM raise_exception_invalid_or_missing_args('read_devices', 'userId');
end if;


-- if installationId is missing, it should return all the devices (among all installations for a given user)

RETURN QUERY

select * from t_devices
where 
  user_id = _user_id and
  (_installation_id is null or installation_id = _installation_id)
order by id asc;


RETURN;


END;
$fn$
LANGUAGE plpgsql;


/*

select * from read_devices('{ 
    "userId": 1,
    "installationId": 1

}');



-- installationId is missing - read all devices for the given user

select * from read_devices('{ 
    "userId": 1
}');



-- if there is some missing argument, error P0000 is thrown

select * from read_devices('{ 
    "xuserId": 1
}');



*/




CREATE OR REPLACE FUNCTION read_devices_by_mac(options jsonb)
RETURNS SETOF t_devices 
AS $fn$

DECLARE

-- variables for input query options
_mac macaddr;


BEGIN

_mac := COALESCE((options->>'mac')::macaddr);

if _mac is null then
  PERFORM raise_exception_invalid_or_missing_args('read_devices_by_mac', 'mac');
end if;


RETURN QUERY

select * from t_devices
where 
  mac = _mac 
order by id asc;


RETURN;


END;
$fn$
LANGUAGE plpgsql;


/*

select * from read_devices('{ 
    "userId": 1,
    "installationId": 1

}');



-- installationId is missing - read all devices for the given user

select * from read_devices_by_mac('{ 
    "xxx": "xx"
}');



-- if there is some missing argument, error P0000 is thrown

select * from read_devices('{ 
    "xuserId": 1
}');



*/

