/**
 * Created by dnd on 7/21/17.
 */
class Sprite {
    constructor(width = 0, height = 0, ticksPerFrame = 0,
                rowFrameCount = 1, colFrameCount = 1,
                rowFrameIndex = 0, colFrameIndex = 0) {
        this.width = width;
        this.height = height;
        this.singleFrameWidth = width / rowFrameCount;
        this.singleFrameHeight = height / colFrameCount;
        this.rowFrameCount = rowFrameCount;
        this.colFrameCount = colFrameCount;
        this.ticksPerFrame = ticksPerFrame;
        this.rowFrameIndex = rowFrameIndex;
        this.colFrameIndex = colFrameIndex;
        this.tickCount = 1;

        // Setup variables here with default values that can be overridden in subclasses for specific sprite scaling
        // (For example, these values are overridden in tankSprite to set a custom scaling factor for tanks)
        this.scaleFactorWidth = 1;
        this.scaleFactorHeight = 1;
    }

    update() {
        this.tickCount += 1;

        // Check if time to update frame
        if (this.tickCount > this.ticksPerFrame) {
            // Reset tick count
            this.tickCount = 0;

            this.colFrameIndex = ((this.colFrameIndex + 1) % this.colFrameCount);
        }
    };

    static render(sprite, context, image, destX, destY, radians = 0) {
        // Round coordinates to whole pixels to reduce sub-pixel blur and ghosting artifacts
        const drawX = Math.round(destX);
        const drawY = Math.round(destY);

        context.save();

        context.translate(drawX, drawY);
        context.rotate(radians);
        context.translate(-drawX, -drawY);

        const frameWidth = sprite.singleFrameWidth;
        const frameHeight = sprite.singleFrameHeight;
        const drawWidth = frameWidth * sprite.scaleFactorWidth;
        const drawHeight = frameHeight * sprite.scaleFactorHeight;
        const offsetX = drawX - (frameWidth / 2) * sprite.scaleFactorWidth;
        const offsetY = drawY - (frameHeight / 2) * sprite.scaleFactorHeight;

        context.imageSmoothingEnabled = true;
        context.drawImage(
            image,
            sprite.rowFrameIndex * frameWidth,
            sprite.colFrameIndex * frameHeight,
            frameWidth,
            frameHeight,
            Math.round(offsetX),
            Math.round(offsetY),
            Math.round(drawWidth),
            Math.round(drawHeight)
        );

        context.restore();
    };
}

module.exports = Sprite;