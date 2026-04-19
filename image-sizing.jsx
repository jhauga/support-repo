// image-sizing.jsx
// Resizes artwork entries inside the "Screenshots" layer,
// then matches or creates artboards for each processed element.
// Usage: Run from File > Scripts > Other Scripts in Adobe Illustrator.

#target illustrator

(function () {
    var SCREENSHOTS_LAYER_NAME = "Screenshots";
    var TARGET_WIDTH_POINTS = 360;

    if (app.documents.length === 0) {
        alert("No documents are open.");
        return;
    }

    var doc = app.activeDocument;
    var screenshotsLayer = findLayerByName(doc.layers, SCREENSHOTS_LAYER_NAME);

    if (!screenshotsLayer) {
        alert("Layer not found: " + SCREENSHOTS_LAYER_NAME);
        return;
    }

    var targets = [];
    collectTargets(screenshotsLayer, targets);

    if (targets.length === 0) {
        alert(
            "No processable entries with artwork were found in \"" + SCREENSHOTS_LAYER_NAME + "\"." +
            "\nChild layers: " + screenshotsLayer.layers.length +
            "\nPage items: " + screenshotsLayer.pageItems.length
        );
        return;
    }

    var savedInteraction = app.userInteractionLevel;
    app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;

    try {
        for (var i = 0; i < targets.length; i++) {
            processTarget(doc, targets[i]);
        }

        doc.selection = null;
        alert("Script Complete");
    } catch (e) {
        alert("Image sizing error: " + e.message);
    } finally {
        app.userInteractionLevel = savedInteraction;
    }

    function processTarget(docRef, target) {
        var items = getTargetItems(target);

        if (items.length === 0) {
            return;
        }

        selectItems(docRef, items);

        var beforeBounds = getCombinedBounds(items);
        var currentWidth = beforeBounds[2] - beforeBounds[0];

        if (currentWidth <= 0) {
            throw new Error("Target has zero width: " + target.label);
        }

        var scalePercent = (TARGET_WIDTH_POINTS / currentWidth) * 100;
        resizeItems(items, scalePercent);

        var afterBounds = getCombinedBounds(items);
        var artboardIndex = findContainingArtboard(docRef, afterBounds);

        if (artboardIndex === -1) {
            docRef.artboards.add(toArtboardRect(afterBounds));
            artboardIndex = docRef.artboards.length - 1;
        }

        docRef.artboards.setActiveArtboardIndex(artboardIndex);
        docRef.artboards[artboardIndex].artboardRect = toArtboardRect(afterBounds);
        centerViewOnArtboard(docRef, artboardIndex);

        app.redraw();
    }

    function collectTargets(parentLayer, result) {
        collectChildLayers(parentLayer, result);

        if (result.length > 0) {
            return;
        }

        collectTopLevelPageItems(parentLayer, result);
    }

    function findLayerByName(layerCollection, layerName) {
        for (var i = 0; i < layerCollection.length; i++) {
            var layer = layerCollection[i];

            if (layer.name === layerName) {
                return layer;
            }

            var nested = findLayerByName(layer.layers, layerName);
            if (nested) {
                return nested;
            }
        }

        return null;
    }

    function collectChildLayers(parentLayer, result) {
        for (var i = 0; i < parentLayer.layers.length; i++) {
            var childLayer = parentLayer.layers[i];

            if (!isLayerUsable(childLayer)) {
                continue;
            }

            if (hasSelectableArtwork(childLayer)) {
                result.push({
                    kind: "layer",
                    source: childLayer,
                    label: childLayer.name
                });
            }
        }
    }

    function collectTopLevelPageItems(parentLayer, result) {
        for (var i = 0; i < parentLayer.pageItems.length; i++) {
            var item = parentLayer.pageItems[i];

            if (item.parent !== parentLayer) {
                continue;
            }

            if (!isPageItemUsable(item)) {
                continue;
            }

            result.push({
                kind: "item",
                source: item,
                label: getPageItemLabel(item)
            });
        }
    }

    function isLayerUsable(layer) {
        return layer.visible && !layer.locked;
    }

    function hasSelectableArtwork(layer) {
        return getSelectableItems(layer).length > 0;
    }

    function isPageItemUsable(item) {
        return !item.hidden && !item.locked;
    }

    function getTargetItems(target) {
        if (target.kind === "layer") {
            return getSelectableItems(target.source);
        }

        return [target.source];
    }

    function getSelectableItems(layer) {
        var items = [];

        for (var i = 0; i < layer.pageItems.length; i++) {
            var item = layer.pageItems[i];

            if (isPageItemUsable(item)) {
                items.push(item);
            }
        }

        return items;
    }

    function getPageItemLabel(item) {
        if (item.name && item.name !== "") {
            return item.name;
        }

        if (item.typename === "GroupItem") {
            return "<Group>";
        }

        if (item.typename === "PlacedItem" || item.typename === "RasterItem") {
            return "<Image>";
        }

        return "<" + item.typename.replace(/Item$/, "") + ">";
    }

    function selectItems(docRef, items) {
        docRef.selection = null;

        for (var i = 0; i < items.length; i++) {
            items[i].selected = true;
        }
    }

    function resizeItems(items, scalePercent) {
        for (var i = 0; i < items.length; i++) {
            items[i].resize(
                scalePercent,
                scalePercent,
                true,
                true,
                true,
                true,
                scalePercent
            );
        }
    }

    function getCombinedBounds(items) {
        var bounds = null;

        for (var i = 0; i < items.length; i++) {
            var itemBounds = items[i].visibleBounds;

            if (!bounds) {
                bounds = [itemBounds[0], itemBounds[1], itemBounds[2], itemBounds[3]];
                continue;
            }

            if (itemBounds[0] < bounds[0]) bounds[0] = itemBounds[0];
            if (itemBounds[1] > bounds[1]) bounds[1] = itemBounds[1];
            if (itemBounds[2] > bounds[2]) bounds[2] = itemBounds[2];
            if (itemBounds[3] < bounds[3]) bounds[3] = itemBounds[3];
        }

        if (!bounds) {
            throw new Error("Unable to determine artwork bounds.");
        }

        return bounds;
    }

    function findContainingArtboard(docRef, bounds) {
        for (var i = 0; i < docRef.artboards.length; i++) {
            var rect = docRef.artboards[i].artboardRect;

            if (isBoundsInsideRect(bounds, rect)) {
                return i;
            }
        }

        return -1;
    }

    function isBoundsInsideRect(bounds, rect) {
        return bounds[0] >= rect[0] &&
            bounds[1] <= rect[1] &&
            bounds[2] <= rect[2] &&
            bounds[3] >= rect[3];
    }

    function toArtboardRect(bounds) {
        return [bounds[0], bounds[1], bounds[2], bounds[3]];
    }

    function centerViewOnArtboard(docRef, artboardIndex) {
        if (docRef.views.length === 0) {
            return;
        }

        var rect = docRef.artboards[artboardIndex].artboardRect;
        var centerX = (rect[0] + rect[2]) / 2;
        var centerY = (rect[1] + rect[3]) / 2;

        docRef.views[0].centerPoint = [centerX, centerY];
    }
})();
