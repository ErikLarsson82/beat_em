define('utils', [], function () {
  return {
    copy: function (obj) {
      return JSON.parse(JSON.stringify(obj))
    },
    cap: function (value, min, max) {
      if (value < max) {
        return Math.max(value, min)
      }
      return max
    },
    interpolateLinear: function (steps, start, end) {
      const result = []
      const stepValue = (end - start) / (steps - 1)
      for (let i = 0; i < steps; i++) {
        result.push(start + stepValue * i)
      }
      return result
    },
    getNormalizedVector: function (angle) {
      return {
        x: Math.cos(angle),
        y: Math.sin(angle),
      }
    },
    getAngle: function (position1, position2) {
      const dx = position2.x - position1.x
      const dy = position2.y - position1.y
      return Math.atan2(dy, dx)
    },
    addVectors: function (vector1, vector2) {
      return {
        x: vector1.x + vector2.x,
        y: vector1.y + vector2.y,
      }
    },
    isXYInsideRect: function (x, y, rx, ry, rw, rh) {
      return (x > rx && x < rx + rw) &&
          (y > ry && y < ry + rh)
    },
    assert: function (value) {
      if (!value) {
        throw Error('utils.assert')
      }
    },
    assertKey: function (obj, key) {
      if (obj[key] === undefined) {
        throw Error(`utils.assertKey: key '${key}' not found`)
      }
    }
  }
})
