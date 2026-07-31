import importlib


def test_game_and_shiritori_schemas_import_without_cycles():
    importlib.import_module("app.schemas.game")
    importlib.import_module("app.schemas.shiritori")
