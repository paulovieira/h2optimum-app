-- reset database (except measurements)
drop table t_soil_types cascade;
drop table t_crop_types cascade;
drop table t_trigger_types cascade;
drop table t_action_types cascade;
drop table t_device_types cascade;
drop table t_users cascade;
drop table t_devices cascade;
drop table t_installations cascade;
drop table t_triggers cascade;
delete from _v.patches;
