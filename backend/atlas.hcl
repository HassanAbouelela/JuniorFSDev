data "external_schema" "app" {
  program = ["python", "-m", "app.load_models"]
}

env "dev" {
  src = data.external_schema.app.url

  # Read the url from the env, or fallback to localhost:5432
  url = getenv("DATABASE_URL") != "" ? getenv("DATABASE_URL") : "postgresql://postgres:postgres@localhost:5432/postgres?sslmode=disable"
  dev = "docker://postgres/17/dev"

  migration {
    dir = "file://migrations"
  }

  format {
    migrate {
     diff = "{{ sql . \"  \" }}"
    }
  }
}

env "CI" {
  src = data.external_schema.app.url

  url = "postgresql://postgres:postgres@localhost:5432/postgres?sslmode=disable"
  dev = "docker://postgres/17/dev"

  migration {
    dir = "file://migrations"
  }
}

env "prod" {
    src = data.external_schema.app.url

    url = getenv("DATABASE_URL")
    dev = "docker://postgres/17/dev"

    migration {
      dir = "file://migrations"
    }
}
