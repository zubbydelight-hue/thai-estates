"""Geo Color Coder — классификация полигонов по цвету и окраске растровой карты."""


def classFactory(iface):  # noqa: N802 (имя требуется QGIS)
    from .plugin import GeoColorCoderPlugin

    return GeoColorCoderPlugin(iface)
