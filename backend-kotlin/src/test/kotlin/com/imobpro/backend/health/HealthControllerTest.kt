package com.imobpro.backend.health

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class HealthControllerTest {

    @Test
    fun `health response exposes service status`() {
        val response = HealthController().health()

        assertEquals("UP", response.status)
        assertEquals("imob-pro-backend", response.service)
    }
}
