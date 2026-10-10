CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 10000 CACHE 1),
	"user_name" varchar(64) NOT NULL CONSTRAINT "users_username_unique" UNIQUE,
	"display_name" varchar(255) NOT NULL,
	"email" varchar(255) CONSTRAINT "users_email_unique" UNIQUE,
	"password" varchar(255) NOT NULL
);
