package com.iamjarl.design

import androidx.compose.ui.graphics.Color
import org.junit.Assert.fail
import kotlin.math.abs

// Written by hand, unlike the tests beside it: the tests compare each colour with
// the string tokens.json holds, parsed here, so a wrong conversion in the
// generator cannot pass by being wrong in both places.

/** A tokens.json colour, "#RRGGBB" or "rgba(r, g, b, a)". */
fun parseToken(value: String): Color {
    val v = value.trim()
    if (v.length == 7 && v.startsWith("#")) {
        val n = v.substring(1).toLong(16)
        return Color(red = ((n shr 16) and 0xFF).toInt(), green = ((n shr 8) and 0xFF).toInt(), blue = (n and 0xFF).toInt())
    }
    val m = Regex("""rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)""").matchEntire(v)
        ?: error("Not a tokens.json colour: $value")
    val (r, g, b, a) = m.destructured
    return Color(red = r.toInt() / 255f, green = g.toInt() / 255f, blue = b.toInt() / 255f, alpha = a.toFloat())
}

/** The same colour to within one step of 8 bits a channel, which is what an sRGB Color holds. */
fun assertColour(token: String, actual: Color, name: String) {
    val want = parseToken(token)
    val pairs = listOf(want.red to actual.red, want.green to actual.green, want.blue to actual.blue, want.alpha to actual.alpha)
    if (!pairs.all { (a, b) -> abs(a - b) <= 1f / 255f }) fail("$name: tokens.json has $token, DesignTokens has $actual")
}
