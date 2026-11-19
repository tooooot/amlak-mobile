#!/bin/bash
# تهيئة مشروع أندرويد المولّد: minSdk 24، target/compile 36 (شرط Play)، AGP/Gradle أحدث، وهوامش النظام (edge-to-edge)
set -e
cd android
sed -i 's/minSdkVersion = [0-9]*/minSdkVersion = 24/; s/compileSdkVersion = [0-9]*/compileSdkVersion = 36/; s/targetSdkVersion = [0-9]*/targetSdkVersion = 36/' variables.gradle
sed -i "s#com.android.tools.build:gradle:[0-9.]*#com.android.tools.build:gradle:8.9.1#" build.gradle
sed -i 's#gradle-[0-9.]*-\(bin\|all\).zip#gradle-8.11.1-all.zip#' gradle/wrapper/gradle-wrapper.properties
echo "android.suppressUnsupportedCompileSdk=36" >> gradle.properties
cat variables.gradle | grep -E "SdkVersion"
D=$(dirname $(find app/src/main/java -name MainActivity.java))
PKG=$(grep -m1 '^package' $D/MainActivity.java | sed 's/package \(.*\);/\1/')
cat > $D/MainActivity.java <<JAVA
package $PKG;

import android.os.Bundle;
import android.view.View;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        View root = findViewById(android.R.id.content);
        getWindow().getDecorView().setBackgroundColor(0xFFF8F3E9);
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            Insets ime = insets.getInsets(WindowInsetsCompat.Type.ime());
            v.setPadding(bars.left, bars.top, bars.right, Math.max(bars.bottom, ime.bottom));
            return WindowInsetsCompat.CONSUMED;
        });
    }
}
JAVA
cat $D/MainActivity.java | head -3
