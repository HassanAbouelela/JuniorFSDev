"""Script called by the atlas configuration to load models."""

# It is never used by the main application

from atlas_provider_sqlalchemy.ddl import print_ddl

from app import models

print_ddl("postgresql", models.ALL_MODELS)
