cmake_minimum_required(VERSION 3.22.1)
project(winforge_runtime)

add_library(winforge_runtime SHARED winforge_runtime.cpp)

# Place ABI-specific Wine/Box64 builds under:
# native/third_party/wine/<abi>/ and native/third_party/box64/<abi>/
# The real engine is intentionally not vendored in this repository.
target_compile_features(winforge_runtime PRIVATE cxx_std_20)
target_compile_definitions(winforge_runtime PRIVATE WINFORGE_WINE_EXTERNAL=0)

find_library(log-lib log)
target_link_libraries(winforge_runtime ${log-lib})
