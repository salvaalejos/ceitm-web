--
-- PostgreSQL database dump
--

\restrict EuFE3iCDUdw23ZOUanJ67fKOf2iDw1jOjfNIS4bfkALP7k5o32dGRCLtbLhg23W

-- Dumped from database version 15.15
-- Dumped by pg_dump version 15.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.scholarshipquota DROP CONSTRAINT IF EXISTS scholarshipquota_scholarship_id_fkey;
ALTER TABLE IF EXISTS ONLY public.scholarshipapplication DROP CONSTRAINT IF EXISTS scholarshipapplication_scholarship_id_fkey;
ALTER TABLE IF EXISTS ONLY public.room DROP CONSTRAINT IF EXISTS room_building_id_fkey;
ALTER TABLE IF EXISTS ONLY public.news DROP CONSTRAINT IF EXISTS news_author_id_fkey;
DROP INDEX IF EXISTS public.ix_user_email;
DROP INDEX IF EXISTS public.ix_scholarshipquota_scholarship_id;
DROP INDEX IF EXISTS public.ix_scholarshipquota_career_name;
DROP INDEX IF EXISTS public.ix_scholarshipapplication_release_folio;
DROP INDEX IF EXISTS public.ix_scholarshipapplication_control_number;
DROP INDEX IF EXISTS public.ix_room_name;
DROP INDEX IF EXISTS public.ix_news_slug;
DROP INDEX IF EXISTS public.ix_news_category;
DROP INDEX IF EXISTS public.ix_convenio_categoria;
DROP INDEX IF EXISTS public.ix_complaint_tracking_code;
DROP INDEX IF EXISTS public.ix_complaint_email;
DROP INDEX IF EXISTS public.ix_career_slug;
DROP INDEX IF EXISTS public.ix_career_name;
DROP INDEX IF EXISTS public.ix_building_name;
DROP INDEX IF EXISTS public.ix_building_code;
ALTER TABLE IF EXISTS ONLY public."user" DROP CONSTRAINT IF EXISTS user_pkey;
ALTER TABLE IF EXISTS ONLY public.scholarshipquota DROP CONSTRAINT IF EXISTS scholarshipquota_pkey;
ALTER TABLE IF EXISTS ONLY public.scholarshipapplication DROP CONSTRAINT IF EXISTS scholarshipapplication_pkey;
ALTER TABLE IF EXISTS ONLY public.scholarship DROP CONSTRAINT IF EXISTS scholarship_pkey;
ALTER TABLE IF EXISTS ONLY public.room DROP CONSTRAINT IF EXISTS room_pkey;
ALTER TABLE IF EXISTS ONLY public.news DROP CONSTRAINT IF EXISTS news_pkey;
ALTER TABLE IF EXISTS ONLY public.document DROP CONSTRAINT IF EXISTS document_pkey;
ALTER TABLE IF EXISTS ONLY public.convenio DROP CONSTRAINT IF EXISTS convenio_pkey;
ALTER TABLE IF EXISTS ONLY public.complaint DROP CONSTRAINT IF EXISTS complaint_pkey;
ALTER TABLE IF EXISTS ONLY public.career DROP CONSTRAINT IF EXISTS career_pkey;
ALTER TABLE IF EXISTS ONLY public.building DROP CONSTRAINT IF EXISTS building_pkey;
ALTER TABLE IF EXISTS ONLY public.auditlog DROP CONSTRAINT IF EXISTS auditlog_pkey;
ALTER TABLE IF EXISTS public."user" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.scholarshipquota ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.scholarshipapplication ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.scholarship ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.room ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.news ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.document ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.convenio ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.complaint ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.career ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.building ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.auditlog ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.user_id_seq;
DROP TABLE IF EXISTS public."user";
DROP SEQUENCE IF EXISTS public.scholarshipquota_id_seq;
DROP TABLE IF EXISTS public.scholarshipquota;
DROP SEQUENCE IF EXISTS public.scholarshipapplication_id_seq;
DROP TABLE IF EXISTS public.scholarshipapplication;
DROP SEQUENCE IF EXISTS public.scholarship_id_seq;
DROP TABLE IF EXISTS public.scholarship;
DROP SEQUENCE IF EXISTS public.room_id_seq;
DROP TABLE IF EXISTS public.room;
DROP SEQUENCE IF EXISTS public.news_id_seq;
DROP TABLE IF EXISTS public.news;
DROP SEQUENCE IF EXISTS public.document_id_seq;
DROP TABLE IF EXISTS public.document;
DROP SEQUENCE IF EXISTS public.convenio_id_seq;
DROP TABLE IF EXISTS public.convenio;
DROP SEQUENCE IF EXISTS public.complaint_id_seq;
DROP TABLE IF EXISTS public.complaint;
DROP SEQUENCE IF EXISTS public.career_id_seq;
DROP TABLE IF EXISTS public.career;
DROP SEQUENCE IF EXISTS public.building_id_seq;
DROP TABLE IF EXISTS public.building;
DROP SEQUENCE IF EXISTS public.auditlog_id_seq;
DROP TABLE IF EXISTS public.auditlog;
DROP TYPE IF EXISTS public.userrole;
DROP TYPE IF EXISTS public.userarea;
DROP TYPE IF EXISTS public.scholarshiptype;
DROP TYPE IF EXISTS public.documentcategory;
DROP TYPE IF EXISTS public.complainttype;
DROP TYPE IF EXISTS public.complaintstatus;
DROP TYPE IF EXISTS public.applicationstatus;
--
-- Name: applicationstatus; Type: TYPE; Schema: public; Owner: ceitm_system_user
--

CREATE TYPE public.applicationstatus AS ENUM (
    'PENDIENTE',
    'EN_REVISION',
    'APROBADA',
    'RECHAZADA',
    'DOCUMENTACION_FALTANTE'
);


ALTER TYPE public.applicationstatus OWNER TO ceitm_system_user;

--
-- Name: complaintstatus; Type: TYPE; Schema: public; Owner: ceitm_system_user
--

CREATE TYPE public.complaintstatus AS ENUM (
    'PENDIENTE',
    'EN_PROCESO',
    'RESUELTO',
    'RECHAZADO'
);


ALTER TYPE public.complaintstatus OWNER TO ceitm_system_user;

--
-- Name: complainttype; Type: TYPE; Schema: public; Owner: ceitm_system_user
--

CREATE TYPE public.complainttype AS ENUM (
    'QUEJA',
    'SUGERENCIA',
    'AMBAS'
);


ALTER TYPE public.complainttype OWNER TO ceitm_system_user;

--
-- Name: documentcategory; Type: TYPE; Schema: public; Owner: ceitm_system_user
--

CREATE TYPE public.documentcategory AS ENUM (
    'FINANCIERO',
    'LEGAL',
    'ACTAS',
    'CONVOCATORIAS',
    'OTROS'
);


ALTER TYPE public.documentcategory OWNER TO ceitm_system_user;

--
-- Name: scholarshiptype; Type: TYPE; Schema: public; Owner: ceitm_system_user
--

CREATE TYPE public.scholarshiptype AS ENUM (
    'ALIMENTICIA',
    'REINSCRIPCION',
    'CLE',
    'OTRA'
);


ALTER TYPE public.scholarshiptype OWNER TO ceitm_system_user;

--
-- Name: userarea; Type: TYPE; Schema: public; Owner: ceitm_system_user
--

CREATE TYPE public.userarea AS ENUM (
    'PRESIDENCIA',
    'SECRETARIA',
    'TESORERIA',
    'CONTRALORIA',
    'ACADEMICO',
    'VINCULACION',
    'BECAS',
    'COMUNICACION',
    'EVENTOS',
    'PREVENCION',
    'MARKETING',
    'CONSEJO_GENERAL',
    'SISTEMAS',
    'NINGUNA'
);


ALTER TYPE public.userarea OWNER TO ceitm_system_user;

--
-- Name: userrole; Type: TYPE; Schema: public; Owner: ceitm_system_user
--

CREATE TYPE public.userrole AS ENUM (
    'ADMIN_SYS',
    'ESTRUCTURA',
    'COORDINADOR',
    'CONCEJAL',
    'VOCAL'
);


ALTER TYPE public.userrole OWNER TO ceitm_system_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: auditlog; Type: TABLE; Schema: public; Owner: ceitm_system_user
--

CREATE TABLE public.auditlog (
    id integer NOT NULL,
    user_id integer NOT NULL,
    user_email character varying NOT NULL,
    user_role character varying NOT NULL,
    action character varying NOT NULL,
    module character varying NOT NULL,
    resource_id character varying,
    details character varying,
    ip_address character varying,
    created_at timestamp without time zone NOT NULL
);


ALTER TABLE public.auditlog OWNER TO ceitm_system_user;

--
-- Name: auditlog_id_seq; Type: SEQUENCE; Schema: public; Owner: ceitm_system_user
--

CREATE SEQUENCE public.auditlog_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.auditlog_id_seq OWNER TO ceitm_system_user;

--
-- Name: auditlog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ceitm_system_user
--

ALTER SEQUENCE public.auditlog_id_seq OWNED BY public.auditlog.id;


--
-- Name: building; Type: TABLE; Schema: public; Owner: ceitm_system_user
--

CREATE TABLE public.building (
    id integer NOT NULL,
    name character varying NOT NULL,
    code character varying NOT NULL,
    description character varying,
    category character varying NOT NULL,
    coordinates json,
    image_url character varying,
    tags character varying
);


ALTER TABLE public.building OWNER TO ceitm_system_user;

--
-- Name: building_id_seq; Type: SEQUENCE; Schema: public; Owner: ceitm_system_user
--

CREATE SEQUENCE public.building_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.building_id_seq OWNER TO ceitm_system_user;

--
-- Name: building_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ceitm_system_user
--

ALTER SEQUENCE public.building_id_seq OWNED BY public.building.id;


--
-- Name: career; Type: TABLE; Schema: public; Owner: ceitm_system_user
--

CREATE TABLE public.career (
    id integer NOT NULL,
    name character varying NOT NULL,
    slug character varying NOT NULL,
    whatsapp_url character varying,
    image_url character varying,
    is_active boolean NOT NULL
);


ALTER TABLE public.career OWNER TO ceitm_system_user;

--
-- Name: career_id_seq; Type: SEQUENCE; Schema: public; Owner: ceitm_system_user
--

CREATE SEQUENCE public.career_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.career_id_seq OWNER TO ceitm_system_user;

--
-- Name: career_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ceitm_system_user
--

ALTER SEQUENCE public.career_id_seq OWNED BY public.career.id;


--
-- Name: complaint; Type: TABLE; Schema: public; Owner: ceitm_system_user
--

CREATE TABLE public.complaint (
    id integer NOT NULL,
    full_name character varying NOT NULL,
    control_number character varying NOT NULL,
    phone_number character varying NOT NULL,
    email character varying NOT NULL,
    career character varying NOT NULL,
    semester character varying NOT NULL,
    type public.complainttype NOT NULL,
    description character varying(2000) NOT NULL,
    evidence_url character varying,
    tracking_code character varying,
    admin_response character varying,
    resolution_evidence_url character varying,
    resolved_at timestamp without time zone,
    status public.complaintstatus NOT NULL,
    created_at timestamp without time zone NOT NULL
);


ALTER TABLE public.complaint OWNER TO ceitm_system_user;

--
-- Name: complaint_id_seq; Type: SEQUENCE; Schema: public; Owner: ceitm_system_user
--

CREATE SEQUENCE public.complaint_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.complaint_id_seq OWNER TO ceitm_system_user;

--
-- Name: complaint_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ceitm_system_user
--

ALTER SEQUENCE public.complaint_id_seq OWNED BY public.complaint.id;


--
-- Name: convenio; Type: TABLE; Schema: public; Owner: ceitm_system_user
--

CREATE TABLE public.convenio (
    nombre character varying NOT NULL,
    descripcion_corta character varying NOT NULL,
    descripcion_larga character varying NOT NULL,
    categoria character varying NOT NULL,
    imagen_url character varying NOT NULL,
    direccion character varying,
    beneficios json NOT NULL,
    social_links json NOT NULL,
    is_active boolean NOT NULL,
    id integer NOT NULL
);


ALTER TABLE public.convenio OWNER TO ceitm_system_user;

--
-- Name: convenio_id_seq; Type: SEQUENCE; Schema: public; Owner: ceitm_system_user
--

CREATE SEQUENCE public.convenio_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.convenio_id_seq OWNER TO ceitm_system_user;

--
-- Name: convenio_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ceitm_system_user
--

ALTER SEQUENCE public.convenio_id_seq OWNED BY public.convenio.id;


--
-- Name: document; Type: TABLE; Schema: public; Owner: ceitm_system_user
--

CREATE TABLE public.document (
    id integer NOT NULL,
    title character varying NOT NULL,
    description character varying,
    file_url character varying NOT NULL,
    category public.documentcategory NOT NULL,
    is_public boolean NOT NULL,
    created_at timestamp without time zone NOT NULL
);


ALTER TABLE public.document OWNER TO ceitm_system_user;

--
-- Name: document_id_seq; Type: SEQUENCE; Schema: public; Owner: ceitm_system_user
--

CREATE SEQUENCE public.document_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.document_id_seq OWNER TO ceitm_system_user;

--
-- Name: document_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ceitm_system_user
--

ALTER SEQUENCE public.document_id_seq OWNED BY public.document.id;


--
-- Name: news; Type: TABLE; Schema: public; Owner: ceitm_system_user
--

CREATE TABLE public.news (
    id integer NOT NULL,
    title character varying NOT NULL,
    slug character varying NOT NULL,
    excerpt character varying(200) NOT NULL,
    content character varying NOT NULL,
    imagen_url character varying,
    category character varying NOT NULL,
    video_url character varying,
    is_published boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    updated_at timestamp without time zone NOT NULL,
    author_id integer
);


ALTER TABLE public.news OWNER TO ceitm_system_user;

--
-- Name: news_id_seq; Type: SEQUENCE; Schema: public; Owner: ceitm_system_user
--

CREATE SEQUENCE public.news_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.news_id_seq OWNER TO ceitm_system_user;

--
-- Name: news_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ceitm_system_user
--

ALTER SEQUENCE public.news_id_seq OWNED BY public.news.id;


--
-- Name: room; Type: TABLE; Schema: public; Owner: ceitm_system_user
--

CREATE TABLE public.room (
    id integer NOT NULL,
    name character varying NOT NULL,
    floor character varying NOT NULL,
    type character varying NOT NULL,
    building_id integer
);


ALTER TABLE public.room OWNER TO ceitm_system_user;

--
-- Name: room_id_seq; Type: SEQUENCE; Schema: public; Owner: ceitm_system_user
--

CREATE SEQUENCE public.room_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.room_id_seq OWNER TO ceitm_system_user;

--
-- Name: room_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ceitm_system_user
--

ALTER SEQUENCE public.room_id_seq OWNED BY public.room.id;


--
-- Name: scholarship; Type: TABLE; Schema: public; Owner: ceitm_system_user
--

CREATE TABLE public.scholarship (
    id integer NOT NULL,
    name character varying NOT NULL,
    type public.scholarshiptype NOT NULL,
    description character varying NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    results_date timestamp without time zone NOT NULL,
    cycle character varying NOT NULL,
    is_active boolean NOT NULL
);


ALTER TABLE public.scholarship OWNER TO ceitm_system_user;

--
-- Name: scholarship_id_seq; Type: SEQUENCE; Schema: public; Owner: ceitm_system_user
--

CREATE SEQUENCE public.scholarship_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.scholarship_id_seq OWNER TO ceitm_system_user;

--
-- Name: scholarship_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ceitm_system_user
--

ALTER SEQUENCE public.scholarship_id_seq OWNED BY public.scholarship.id;


--
-- Name: scholarshipapplication; Type: TABLE; Schema: public; Owner: ceitm_system_user
--

CREATE TABLE public.scholarshipapplication (
    id integer NOT NULL,
    scholarship_id integer NOT NULL,
    full_name character varying NOT NULL,
    email character varying NOT NULL,
    phone_number character varying NOT NULL,
    control_number character varying NOT NULL,
    career character varying NOT NULL,
    semester character varying NOT NULL,
    student_photo character varying NOT NULL,
    cle_control_number character varying,
    level_to_enter character varying,
    arithmetic_average double precision NOT NULL,
    certified_average double precision NOT NULL,
    address character varying NOT NULL,
    origin_address character varying NOT NULL,
    economic_dependence character varying NOT NULL,
    dependents_count integer NOT NULL,
    family_income double precision NOT NULL,
    income_per_capita double precision NOT NULL,
    previous_scholarship character varying NOT NULL,
    release_folio character varying,
    activities character varying,
    motivos character varying(2000) NOT NULL,
    doc_request character varying,
    doc_motivos character varying,
    doc_address character varying NOT NULL,
    doc_income character varying NOT NULL,
    doc_ine character varying NOT NULL,
    doc_kardex character varying NOT NULL,
    doc_extra character varying,
    status public.applicationstatus NOT NULL,
    admin_comments character varying,
    created_at timestamp without time zone NOT NULL
);


ALTER TABLE public.scholarshipapplication OWNER TO ceitm_system_user;

--
-- Name: scholarshipapplication_id_seq; Type: SEQUENCE; Schema: public; Owner: ceitm_system_user
--

CREATE SEQUENCE public.scholarshipapplication_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.scholarshipapplication_id_seq OWNER TO ceitm_system_user;

--
-- Name: scholarshipapplication_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ceitm_system_user
--

ALTER SEQUENCE public.scholarshipapplication_id_seq OWNED BY public.scholarshipapplication.id;


--
-- Name: scholarshipquota; Type: TABLE; Schema: public; Owner: ceitm_system_user
--

CREATE TABLE public.scholarshipquota (
    id integer NOT NULL,
    scholarship_id integer NOT NULL,
    career_name character varying NOT NULL,
    total_slots integer NOT NULL,
    used_slots integer NOT NULL
);


ALTER TABLE public.scholarshipquota OWNER TO ceitm_system_user;

--
-- Name: scholarshipquota_id_seq; Type: SEQUENCE; Schema: public; Owner: ceitm_system_user
--

CREATE SEQUENCE public.scholarshipquota_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.scholarshipquota_id_seq OWNER TO ceitm_system_user;

--
-- Name: scholarshipquota_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ceitm_system_user
--

ALTER SEQUENCE public.scholarshipquota_id_seq OWNED BY public.scholarshipquota.id;


--
-- Name: user; Type: TABLE; Schema: public; Owner: ceitm_system_user
--

CREATE TABLE public."user" (
    id integer NOT NULL,
    email character varying NOT NULL,
    hashed_password character varying NOT NULL,
    full_name character varying NOT NULL,
    phone_number character varying,
    instagram_url character varying,
    role public.userrole NOT NULL,
    area public.userarea NOT NULL,
    career character varying,
    imagen_url character varying,
    is_active boolean NOT NULL,
    created_at timestamp without time zone NOT NULL
);


ALTER TABLE public."user" OWNER TO ceitm_system_user;

--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: ceitm_system_user
--

CREATE SEQUENCE public.user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_id_seq OWNER TO ceitm_system_user;

--
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ceitm_system_user
--

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;


--
-- Name: auditlog id; Type: DEFAULT; Schema: public; Owner: ceitm_system_user
--

ALTER TABLE ONLY public.auditlog ALTER COLUMN id SET DEFAULT nextval('public.auditlog_id_seq'::regclass);


--
-- Name: building id; Type: DEFAULT; Schema: public; Owner: ceitm_system_user
--

ALTER TABLE ONLY public.building ALTER COLUMN id SET DEFAULT nextval('public.building_id_seq'::regclass);


--
-- Name: career id; Type: DEFAULT; Schema: public; Owner: ceitm_system_user
--

ALTER TABLE ONLY public.career ALTER COLUMN id SET DEFAULT nextval('public.career_id_seq'::regclass);


--
-- Name: complaint id; Type: DEFAULT; Schema: public; Owner: ceitm_system_user
--

ALTER TABLE ONLY public.complaint ALTER COLUMN id SET DEFAULT nextval('public.complaint_id_seq'::regclass);


--
-- Name: convenio id; Type: DEFAULT; Schema: public; Owner: ceitm_system_user
--

ALTER TABLE ONLY public.convenio ALTER COLUMN id SET DEFAULT nextval('public.convenio_id_seq'::regclass);


--
-- Name: document id; Type: DEFAULT; Schema: public; Owner: ceitm_system_user
--

ALTER TABLE ONLY public.document ALTER COLUMN id SET DEFAULT nextval('public.document_id_seq'::regclass);


--
-- Name: news id; Type: DEFAULT; Schema: public; Owner: ceitm_system_user
--

ALTER TABLE ONLY public.news ALTER COLUMN id SET DEFAULT nextval('public.news_id_seq'::regclass);


--
-- Name: room id; Type: DEFAULT; Schema: public; Owner: ceitm_system_user
--

ALTER TABLE ONLY public.room ALTER COLUMN id SET DEFAULT nextval('public.room_id_seq'::regclass);


--
-- Name: scholarship id; Type: DEFAULT; Schema: public; Owner: ceitm_system_user
--

ALTER TABLE ONLY public.scholarship ALTER COLUMN id SET DEFAULT nextval('public.scholarship_id_seq'::regclass);


--
-- Name: scholarshipapplication id; Type: DEFAULT; Schema: public; Owner: ceitm_system_user
--

ALTER TABLE ONLY public.scholarshipapplication ALTER COLUMN id SET DEFAULT nextval('public.scholarshipapplication_id_seq'::regclass);


--
-- Name: scholarshipquota id; Type: DEFAULT; Schema: public; Owner: ceitm_system_user
--

ALTER TABLE ONLY public.scholarshipquota ALTER COLUMN id SET DEFAULT nextval('public.scholarshipquota_id_seq'::regclass);


--
-- Name: user id; Type: DEFAULT; Schema: public; Owner: ceitm_system_user
--

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


--
-- Data for Name: auditlog; Type: TABLE DATA; Schema: public; Owner: ceitm_system_user
--

COPY public.auditlog (id, user_id, user_email, user_role, action, module, resource_id, details, ip_address, created_at) FROM stdin;
1	1	admin@ceitm.mx	admin_sys	LOGIN	AUTH	\N	Inicio de sesión exitoso	\N	2026-01-31 21:44:56.366934
2	1	admin@ceitm.mx	admin_sys	LOGIN	AUTH	\N	Inicio de sesión exitoso	\N	2026-01-31 22:10:14.327112
3	1	admin@ceitm.mx	admin_sys	LOGIN	AUTH	\N	Inicio de sesión exitoso	\N	2026-01-31 22:16:53.024368
4	1	admin@ceitm.mx	admin_sys	LOGIN	AUTH	\N	Inicio de sesión exitoso	\N	2026-01-31 22:29:01.035621
5	1	admin@ceitm.mx	admin_sys	LOGIN	AUTH	\N	Inicio de sesión exitoso	\N	2026-01-31 23:49:24.654602
\.


--
-- Data for Name: building; Type: TABLE DATA; Schema: public; Owner: ceitm_system_user
--

COPY public.building (id, name, code, description, category, coordinates, image_url, tags) FROM stdin;
2	Edificio A	A	Ciencias Básicas. Aulas de tronco común y laboratorios de química.	AULAS	{"lat": 19.723023321057774, "lng": -101.1858332103096}	\N	basicas, quimica, tronco comun, a
6	Biblioteca	BIB	Centro de Información 'Reyes Heroles'.	SERVICIOS	{"lat": 19.7210390161279, "lng": -101.18386184655269}	\N	libros, estudio, internet, bib
7	Edificio AE	AE		AULAS	{"lat": 19.72112977610549, "lng": -101.18422121178249}	\N	
8	Edificio Y	Y	Edificio de electrónica con laboratorios de uso común en las ingenierías	AULAS	{"lat": 19.721138469776836, "lng": -101.18454773335725}	\N	laboratorios, electronica, baños
9	Edificio AG	AG	Aulas de mecatrónica con laboratorios de cómputo para uso común de diferentes ingenierías	AULAS	{"lat": 19.723177991744798, "lng": -101.18417754618817}	\N	isc, computo, mecatrónica, baños, biomédica
10	Edificio CH	CH	Edificio de la carrera de Ingenieria Industrial, con algunas aulas de uso común	AULAS	{"lat": 19.723500611528852, "lng": -101.18509148344852}	\N	industrial, baños
11	Oficinas CLE	CLE	Oficinas de la coordinación de lenguas extranjeras, aquí puedes inscribirte a los programas de idiomas o resolver tus problemas al respecto	ADMINISTRATIVO	{"lat": 19.723220400458825, "lng": -101.1848914107995}	\N	cle, inglés, idiomas, francés, alemán
12	Pony Cafeteria	PC	Cafetería principal del ITM	ALIMENTOS	{"lat": 19.721500210923022, "lng": -101.18563347406631}	\N	cafeteria, comida, alimentos
13	Edificio S1 (CEITM)	CEITM	Oficinas del consejo estudiantil del ITM, aquí puedes acudir en caso de necesitar ayuda en cualquier ámbito académico	ADMINISTRATIVO	{"lat": 19.721421968157234, "lng": -101.18695225413808}	\N	ceitm, estudiantes, ayuda
14	Auditorio "Heber Soto Fierro"	AUD	Auditorio donde se realizan diferentes eventos como bienvenidas, eventos culturales, deportivos y académicos	SERVICIOS	{"lat": 19.721196679945653, "lng": -101.18614255842411}	\N	gym, deportes, cultura, bienvenida
1	Edificio K	K	Ingeniería en Sistemas Computacionales. Aulas de especialidad y centros de cómputo.	AULAS	{"lat": 19.72205538251936, "lng": -101.18574221404555}	\N	sistemas, computo, redes, isc, k
15	Edificio I	I	Edificio administrativo de sistemas, además de con algunos laboratorios para redes.	ADMINISTRATIVO	{"lat": 19.722287740673877, "lng": -101.18539284384457}	\N	isc, redes, admin, jefe, claudio
\.


--
-- Data for Name: career; Type: TABLE DATA; Schema: public; Owner: ceitm_system_user
--

COPY public.career (id, name, slug, whatsapp_url, image_url, is_active) FROM stdin;
1	Ingeniería en Semiconductores	semiconductores	\N	\N	t
2	Ingeniería Eléctrica	electrica	\N	\N	t
3	Ingeniería Electrónica	electronica	\N	\N	t
4	Ingeniería en Materiales	materiales	\N	\N	t
5	Licenciatura en Administración	administracion	\N	\N	t
6	Contador Público	contador	\N	\N	t
7	Ingeniería Bioquímica	bioquimica	\N	\N	t
8	Ingeniería Mecánica	mecanica	\N	\N	t
9	Ingeniería en Sistemas Computacionales	sistemas	\N	\N	t
10	Ingeniería en Mecatronica	mecatronica	\N	\N	t
11	Ingeniería en Gestión Empresarial	gestion	\N	\N	t
12	Ingeniería en Ciberseguridad	ciberseguridad	\N	\N	t
13	Ingeniería en Tics	tics	\N	\N	t
\.


--
-- Data for Name: complaint; Type: TABLE DATA; Schema: public; Owner: ceitm_system_user
--

COPY public.complaint (id, full_name, control_number, phone_number, email, career, semester, type, description, evidence_url, tracking_code, admin_response, resolution_evidence_url, resolved_at, status, created_at) FROM stdin;
1	Juan Pérez (Alumno Test)	21120000	4431234567	juan.test@itm.mx	Ingeniería en Sistemas Computacionales	5to Semestre	QUEJA	Las luces del edificio K están parpadeando mucho y lastiman la vista en clases nocturnas.	\N	CEITM-2025-001	\N	\N	\N	PENDIENTE	2026-01-31 21:43:40.378559
\.


--
-- Data for Name: convenio; Type: TABLE DATA; Schema: public; Owner: ceitm_system_user
--

COPY public.convenio (nombre, descripcion_corta, descripcion_larga, categoria, imagen_url, direccion, beneficios, social_links, is_active, id) FROM stdin;
Gimnasio PowerFit	20% de descuento en mensualidad.	Presenta tu credencial vigente y obtén descuento en inscripción y mensualidad. Incluye acceso a regaderas.	SALUD	https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80	Av. Tecnológico #123	["Inscripci\\u00f3n GRATIS", "Mensualidad $350"]	{"facebook": "https://facebook.com", "instagram": "https://instagram.com"}	t	1
Papelería El Pony	Copias a 50 centavos.	Todo lo que necesitas para tus proyectos. Impresiones, engargolados y material de dibujo.	SERVICIOS	https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80	Frente a la puerta 1	["10% en listas de \\u00fatiles", "Copias B/N $0.50"]	{}	t	2
\.


--
-- Data for Name: document; Type: TABLE DATA; Schema: public; Owner: ceitm_system_user
--

COPY public.document (id, title, description, file_url, category, is_public, created_at) FROM stdin;
\.


--
-- Data for Name: news; Type: TABLE DATA; Schema: public; Owner: ceitm_system_user
--

COPY public.news (id, title, slug, excerpt, content, imagen_url, category, video_url, is_published, created_at, updated_at, author_id) FROM stdin;
1	¡Bienvenidos al nuevo Portal CEITM!	bienvenidos-portal-ceitm	Lanzamos nuestra nueva plataforma digital para estar más conectados.	Estamos orgullosos de presentar la nueva web del Consejo. Aquí podrás tramitar becas, ver convenios y enterarte de todo.	https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80	COMUNIDAD	\N	t	2026-01-31 21:43:40.267057	2026-01-31 21:43:40.267069	\N
2	Torneo de Fútbol Inter-Carreras	torneo-futbol-2025	Prepara tu equipo, las inscripciones abren la próxima semana.	El departamento de extraescolares junto con el consejo te invitan al torneo relámpago. Premios a los 3 primeros lugares.	https://images.unsplash.com/photo-1579952363873-27f3bde9be51?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80	DEPORTES	\N	t	2026-01-31 21:43:40.272461	2026-01-31 21:43:40.27247	\N
\.


--
-- Data for Name: room; Type: TABLE DATA; Schema: public; Owner: ceitm_system_user
--

COPY public.room (id, name, floor, type, building_id) FROM stdin;
1	Centro de Cómputo	PB	PC	1
2	Sala Audiovisual	PB	AUDITORIUM	1
3	K1	1	CLASSROOM	1
4	K2	1	CLASSROOM	1
5	Lab. Redes	2	LAB	1
6	A1	PB	CLASSROOM	2
7	A2	PB	CLASSROOM	2
8	Lab. Química	1	LAB	2
9	A4	1	CLASSROOM	2
18	Sala General	PB	CLASSROOM	6
19	Ciberteca	1	PC	6
16	Comedor Principal	PB	FOOD	\N
17	Zona Techada	PB	FOOD	\N
13	Serv. Escolares	PB	OFFICE	\N
14	Cajas	PB	OFFICE	\N
15	Dirección	1	OFFICE	\N
10	B1	PB	CLASSROOM	\N
11	Taller Métodos	PB	LAB	\N
12	Ergonomía	1	LAB	\N
20	Jefatura de ISC	PB	OFFICE	15
21	Pony Papeleria	PB	STORE	6
23	Cubículos 10-20	PB	OFFICE	6
22	Cubículos 1-10 	1	OFFICE	6
\.


--
-- Data for Name: scholarship; Type: TABLE DATA; Schema: public; Owner: ceitm_system_user
--

COPY public.scholarship (id, name, type, description, start_date, end_date, results_date, cycle, is_active) FROM stdin;
1	Beca de Reinscripción 2025	REINSCRIPCION	Apoyo para el pago de la inscripción al semestre Enero-Junio 2025.	2026-01-31 21:43:40.287034	2026-03-02 21:43:40.287035	2026-03-17 21:43:40.28704	2025-1	t
2	Beca Alimenticia (Comedor)	ALIMENTICIA	Desayunos gratuitos.	2025-12-02 21:43:40.294675	2026-01-21 21:43:40.294681	2026-01-26 21:43:40.294682	2024-2	f
\.


--
-- Data for Name: scholarshipapplication; Type: TABLE DATA; Schema: public; Owner: ceitm_system_user
--

COPY public.scholarshipapplication (id, scholarship_id, full_name, email, phone_number, control_number, career, semester, student_photo, cle_control_number, level_to_enter, arithmetic_average, certified_average, address, origin_address, economic_dependence, dependents_count, family_income, income_per_capita, previous_scholarship, release_folio, activities, motivos, doc_request, doc_motivos, doc_address, doc_income, doc_ine, doc_kardex, doc_extra, status, admin_comments, created_at) FROM stdin;
1	1	Salvador Alejos	alejossalva@gmail.com	4381126867	2342123	Ingeniería en Semiconductores	2o Semestre	http://localhost:8000/static/uploads/chayan_chikito.jpg			0.1	0.2	sdfsd	werw	Padres	1	1	1	No		fhth	xcvsdf sdfsefwsef we fwe fsdf scvesd fsef wsefsdf es fsdf	\N	\N	http://localhost:8000/static/uploads/comprobante_domicilio.jpg	http://localhost:8000/static/uploads/2023-04-11.pdf	http://localhost:8000/static/uploads/credencial_tec_frente.jpg	http://localhost:8000/static/uploads/carga_academica.png		PENDIENTE	\N	2026-02-01 00:06:34.97506
\.


--
-- Data for Name: scholarshipquota; Type: TABLE DATA; Schema: public; Owner: ceitm_system_user
--

COPY public.scholarshipquota (id, scholarship_id, career_name, total_slots, used_slots) FROM stdin;
1	1	Ingeniería en Semiconductores	10	0
2	1	Ingeniería Eléctrica	10	0
3	1	Ingeniería Electrónica	10	0
4	1	Ingeniería en Materiales	10	0
5	1	Licenciatura en Administración	10	0
6	1	Contador Público	10	0
7	1	Ingeniería Bioquímica	10	0
8	1	Ingeniería Mecánica	10	0
9	1	Ingeniería en Sistemas Computacionales	10	0
10	1	Ingeniería en Mecatronica	10	0
11	1	Ingeniería en Gestión Empresarial	10	0
12	1	Ingeniería en Ciberseguridad	10	0
13	1	Ingeniería en Tics	10	0
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: ceitm_system_user
--

COPY public."user" (id, email, hashed_password, full_name, phone_number, instagram_url, role, area, career, imagen_url, is_active, created_at) FROM stdin;
1	admin@ceitm.mx	$2b$12$QOtShiunT6.xSrPjWVKRBufuUekvzyPK6OPfI4042JUnmSGtAgcJC	Salvador Alejos (Admin)	\N	\N	ADMIN_SYS	SISTEMAS	Ingeniería en Sistemas Computacionales	\N	t	2026-01-31 21:43:40.257168
\.


--
-- Name: auditlog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ceitm_system_user
--

SELECT pg_catalog.setval('public.auditlog_id_seq', 5, true);


--
-- Name: building_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ceitm_system_user
--

SELECT pg_catalog.setval('public.building_id_seq', 15, true);


--
-- Name: career_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ceitm_system_user
--

SELECT pg_catalog.setval('public.career_id_seq', 13, true);


--
-- Name: complaint_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ceitm_system_user
--

SELECT pg_catalog.setval('public.complaint_id_seq', 1, true);


--
-- Name: convenio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ceitm_system_user
--

SELECT pg_catalog.setval('public.convenio_id_seq', 2, true);


--
-- Name: document_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ceitm_system_user
--

SELECT pg_catalog.setval('public.document_id_seq', 1, false);


--
-- Name: news_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ceitm_system_user
--

SELECT pg_catalog.setval('public.news_id_seq', 2, true);


--
-- Name: room_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ceitm_system_user
--

SELECT pg_catalog.setval('public.room_id_seq', 23, true);


--
-- Name: scholarship_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ceitm_system_user
--

SELECT pg_catalog.setval('public.scholarship_id_seq', 2, true);


--
-- Name: scholarshipapplication_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ceitm_system_user
--

SELECT pg_catalog.setval('public.scholarshipapplication_id_seq', 1, true);


--
-- Name: scholarshipquota_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ceitm_system_user
--

SELECT pg_catalog.setval('public.scholarshipquota_id_seq', 13, true);


--
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ceitm_system_user
--

SELECT pg_catalog.setval('public.user_id_seq', 1, true);


--
-- Name: auditlog auditlog_pkey; Type: CONSTRAINT; Schema: public; Owner: ceitm_system_user
--

ALTER TABLE ONLY public.auditlog
    ADD CONSTRAINT auditlog_pkey PRIMARY KEY (id);


--
-- Name: building building_pkey; Type: CONSTRAINT; Schema: public; Owner: ceitm_system_user
--

ALTER TABLE ONLY public.building
    ADD CONSTRAINT building_pkey PRIMARY KEY (id);


--
-- Name: career career_pkey; Type: CONSTRAINT; Schema: public; Owner: ceitm_system_user
--

ALTER TABLE ONLY public.career
    ADD CONSTRAINT career_pkey PRIMARY KEY (id);


--
-- Name: complaint complaint_pkey; Type: CONSTRAINT; Schema: public; Owner: ceitm_system_user
--

ALTER TABLE ONLY public.complaint
    ADD CONSTRAINT complaint_pkey PRIMARY KEY (id);


--
-- Name: convenio convenio_pkey; Type: CONSTRAINT; Schema: public; Owner: ceitm_system_user
--

ALTER TABLE ONLY public.convenio
    ADD CONSTRAINT convenio_pkey PRIMARY KEY (id);


--
-- Name: document document_pkey; Type: CONSTRAINT; Schema: public; Owner: ceitm_system_user
--

ALTER TABLE ONLY public.document
    ADD CONSTRAINT document_pkey PRIMARY KEY (id);


--
-- Name: news news_pkey; Type: CONSTRAINT; Schema: public; Owner: ceitm_system_user
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_pkey PRIMARY KEY (id);


--
-- Name: room room_pkey; Type: CONSTRAINT; Schema: public; Owner: ceitm_system_user
--

ALTER TABLE ONLY public.room
    ADD CONSTRAINT room_pkey PRIMARY KEY (id);


--
-- Name: scholarship scholarship_pkey; Type: CONSTRAINT; Schema: public; Owner: ceitm_system_user
--

ALTER TABLE ONLY public.scholarship
    ADD CONSTRAINT scholarship_pkey PRIMARY KEY (id);


--
-- Name: scholarshipapplication scholarshipapplication_pkey; Type: CONSTRAINT; Schema: public; Owner: ceitm_system_user
--

ALTER TABLE ONLY public.scholarshipapplication
    ADD CONSTRAINT scholarshipapplication_pkey PRIMARY KEY (id);


--
-- Name: scholarshipquota scholarshipquota_pkey; Type: CONSTRAINT; Schema: public; Owner: ceitm_system_user
--

ALTER TABLE ONLY public.scholarshipquota
    ADD CONSTRAINT scholarshipquota_pkey PRIMARY KEY (id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: ceitm_system_user
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: ix_building_code; Type: INDEX; Schema: public; Owner: ceitm_system_user
--

CREATE UNIQUE INDEX ix_building_code ON public.building USING btree (code);


--
-- Name: ix_building_name; Type: INDEX; Schema: public; Owner: ceitm_system_user
--

CREATE INDEX ix_building_name ON public.building USING btree (name);


--
-- Name: ix_career_name; Type: INDEX; Schema: public; Owner: ceitm_system_user
--

CREATE UNIQUE INDEX ix_career_name ON public.career USING btree (name);


--
-- Name: ix_career_slug; Type: INDEX; Schema: public; Owner: ceitm_system_user
--

CREATE UNIQUE INDEX ix_career_slug ON public.career USING btree (slug);


--
-- Name: ix_complaint_email; Type: INDEX; Schema: public; Owner: ceitm_system_user
--

CREATE INDEX ix_complaint_email ON public.complaint USING btree (email);


--
-- Name: ix_complaint_tracking_code; Type: INDEX; Schema: public; Owner: ceitm_system_user
--

CREATE UNIQUE INDEX ix_complaint_tracking_code ON public.complaint USING btree (tracking_code);


--
-- Name: ix_convenio_categoria; Type: INDEX; Schema: public; Owner: ceitm_system_user
--

CREATE INDEX ix_convenio_categoria ON public.convenio USING btree (categoria);


--
-- Name: ix_news_category; Type: INDEX; Schema: public; Owner: ceitm_system_user
--

CREATE INDEX ix_news_category ON public.news USING btree (category);


--
-- Name: ix_news_slug; Type: INDEX; Schema: public; Owner: ceitm_system_user
--

CREATE UNIQUE INDEX ix_news_slug ON public.news USING btree (slug);


--
-- Name: ix_room_name; Type: INDEX; Schema: public; Owner: ceitm_system_user
--

CREATE INDEX ix_room_name ON public.room USING btree (name);


--
-- Name: ix_scholarshipapplication_control_number; Type: INDEX; Schema: public; Owner: ceitm_system_user
--

CREATE INDEX ix_scholarshipapplication_control_number ON public.scholarshipapplication USING btree (control_number);


--
-- Name: ix_scholarshipapplication_release_folio; Type: INDEX; Schema: public; Owner: ceitm_system_user
--

CREATE INDEX ix_scholarshipapplication_release_folio ON public.scholarshipapplication USING btree (release_folio);


--
-- Name: ix_scholarshipquota_career_name; Type: INDEX; Schema: public; Owner: ceitm_system_user
--

CREATE INDEX ix_scholarshipquota_career_name ON public.scholarshipquota USING btree (career_name);


--
-- Name: ix_scholarshipquota_scholarship_id; Type: INDEX; Schema: public; Owner: ceitm_system_user
--

CREATE INDEX ix_scholarshipquota_scholarship_id ON public.scholarshipquota USING btree (scholarship_id);


--
-- Name: ix_user_email; Type: INDEX; Schema: public; Owner: ceitm_system_user
--

CREATE UNIQUE INDEX ix_user_email ON public."user" USING btree (email);


--
-- Name: news news_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ceitm_system_user
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_author_id_fkey FOREIGN KEY (author_id) REFERENCES public."user"(id);


--
-- Name: room room_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ceitm_system_user
--

ALTER TABLE ONLY public.room
    ADD CONSTRAINT room_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.building(id);


--
-- Name: scholarshipapplication scholarshipapplication_scholarship_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ceitm_system_user
--

ALTER TABLE ONLY public.scholarshipapplication
    ADD CONSTRAINT scholarshipapplication_scholarship_id_fkey FOREIGN KEY (scholarship_id) REFERENCES public.scholarship(id);


--
-- Name: scholarshipquota scholarshipquota_scholarship_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ceitm_system_user
--

ALTER TABLE ONLY public.scholarshipquota
    ADD CONSTRAINT scholarshipquota_scholarship_id_fkey FOREIGN KEY (scholarship_id) REFERENCES public.scholarship(id);


--
-- PostgreSQL database dump complete
--

\unrestrict EuFE3iCDUdw23ZOUanJ67fKOf2iDw1jOjfNIS4bfkALP7k5o32dGRCLtbLhg23W

